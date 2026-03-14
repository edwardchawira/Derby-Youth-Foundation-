"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  FolderOpen,
  Plus,
  Upload,
  Download,
  FileAudio,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Archive,
  Trash2,
  History,
  Send,
  X,
  FileText,
  Music2,
  ArrowRight,
  Play,
  Pause
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AudioPlayerProvider, useAudioPlayer } from '@/lib/audio-player-context';
import { AudioPlayer } from './collab/audio-player';

interface Project {
  id: string;
  project_name: string;
  description: string;
  creator_id: string;
  status: string;
  genre: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  collaborators?: Collaborator[];
  role?: string;
  can_upload?: boolean;
  can_delete?: boolean;
}

interface Collaborator {
  id: string;
  musician_id: string;
  role: string;
  can_upload: boolean;
  can_delete: boolean;
  musician?: {
    full_name: string;
    role: string;
    profile_photo_url: string;
  };
}

interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  version_number: number;
  parent_file_id: string | null;
  notes: string;
  is_latest_version: boolean;
  created_at: string;
  uploader?: {
    full_name: string;
    profile_photo_url: string;
  };
}

interface Comment {
  id: string;
  project_id: string;
  file_id: string | null;
  musician_id: string;
  comment_text: string;
  created_at: string;
  musician?: {
    full_name: string;
    profile_photo_url: string;
  };
}

interface ChatMessage {
  id: string;
  project_id: string;
  musician_id: string;
  message_text: string;
  created_at: string;
  musician?: {
    full_name: string;
    profile_photo_url: string;
  };
}

interface ActivityLog {
  id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
  musician?: {
    full_name: string;
  };
}

interface CollaborativeProjectsProps {
  currentMusicianId: string;
  currentMusicianProfile: any;
}

function CollaborativeProjectsInner({ currentMusicianId, currentMusicianProfile }: CollaborativeProjectsProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [projectComments, setProjectComments] = useState<Comment[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const { currentTrack, isPlaying, setCurrentTrack, setIsPlaying } = useAudioPlayer();

  const [chatMessage, setChatMessage] = useState('');

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectGenre, setNewProjectGenre] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileNotes, setFileNotes] = useState('');
  const [bouncingFileId, setBouncingFileId] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [commentFileId, setCommentFileId] = useState<string | null>(null);

  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableMusicians, setAvailableMusicians] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMusicianList, setShowMusicianList] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
    
    // Update last_seen heartbeat to keep musician marked as online
    const updateLastSeen = async () => {
      if (currentMusicianId) {
        // Get user_id from musician profile
        const { data: profile } = await supabase
          .from('musician_profiles')
          .select('user_id')
          .eq('id', currentMusicianId)
          .maybeSingle();
        
        if (profile?.user_id) {
          await supabase.rpc('update_musician_last_seen_on_login', {
            musician_user_id: profile.user_id
          });
        }
      }
    };
    
    updateLastSeen();
    // Update every 2 minutes to keep session active
    const heartbeatInterval = setInterval(updateLastSeen, 2 * 60 * 1000);
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [currentMusicianId]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectDetails(selectedProject.id);
      setupChatSubscription(selectedProject.id);
    }
    return () => {
      supabase.channel('project-chat').unsubscribe();
    };
  }, [selectedProject]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowMusicianList(false);
      }
    };

    if (showMusicianList) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMusicianList]);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('project_collaborators')
      .select(`
        project_id,
        role,
        can_upload,
        can_delete,
        collaboration_projects (
          id,
          project_name,
          description,
          creator_id,
          status,
          genre,
          deadline,
          created_at,
          updated_at
        )
      `)
      .eq('musician_id', currentMusicianId)
      .order('joined_at', { ascending: false });

    if (!error && data) {
      const projectsData = data.map((item: any) => ({
        ...item.collaboration_projects,
        role: item.role,
        can_upload: item.can_upload,
        can_delete: item.can_delete
      }));
      setProjects(projectsData);
    }
    setLoading(false);
  };

  const loadProjectDetails = async (projectId: string) => {
    await Promise.all([
      loadProjectFiles(projectId),
      loadProjectComments(projectId),
      loadChatMessages(projectId),
      loadActivityLog(projectId),
      loadCollaborators(projectId)
    ]);
  };

  const loadProjectFiles = async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_files')
      .select(`
        *,
        uploader:uploaded_by (
          full_name,
          profile_photo_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjectFiles(data);
    }
  };

  const loadProjectComments = async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_comments')
      .select(`
        *,
        musician:musician_id (
          full_name,
          profile_photo_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjectComments(data);
    }
  };

  const loadChatMessages = async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_chat_messages')
      .select(`
        *,
        musician:musician_id (
          full_name,
          profile_photo_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setChatMessages(data);
    }
  };

  const setupChatSubscription = (projectId: string) => {
    const channel = supabase
      .channel('project-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_chat_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          loadChatMessages(projectId);
        }
      )
      .subscribe();
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedProject) {
      toast.error('Please enter a message');
      return;
    }

    const { error } = await supabase
      .from('project_chat_messages')
      .insert({
        project_id: selectedProject.id,
        musician_id: currentMusicianId,
        message_text: chatMessage
      });

    if (error) {
      console.error('Chat message error:', error);
      toast.error(`Failed to send message: ${error.message}`);
      return;
    }

    setChatMessage('');
    await loadChatMessages(selectedProject.id);
  };

  const loadActivityLog = async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_activity_log')
      .select(`
        *,
        musician:musician_id (
          full_name
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setActivityLog(data);
    }
  };

  const loadCollaborators = async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_collaborators')
      .select(`
        *,
        musician:musician_id (
          full_name,
          role,
          profile_photo_url
        )
      `)
      .eq('project_id', projectId);

    if (!error && data && selectedProject) {
      setSelectedProject({
        ...selectedProject,
        collaborators: data
      });
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    if (!currentMusicianId) {
      toast.error('You must be logged in as a musician to create a project');
      return;
    }

    console.log('Creating project with:', {
      project_name: newProjectName,
      creator_id: currentMusicianId,
      genre: newProjectGenre,
      deadline: newProjectDeadline
    });

    const { data, error } = await supabase
      .from('collaboration_projects')
      .insert({
        project_name: newProjectName,
        description: newProjectDescription,
        creator_id: currentMusicianId,
        genre: newProjectGenre,
        deadline: newProjectDeadline || null,
        status: 'active'
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Project creation error:', error);
      toast.error(`Failed to create project: ${error.message || error.details || 'Unknown error'}`);
      return;
    }

    if (!data) {
      toast.error('Project was created but no data was returned');
      return;
    }

    toast.success('Project created successfully!');
    setShowCreateDialog(false);
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectGenre('');
    setNewProjectDeadline('');
    await loadProjects();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !selectedProject) {
      toast.error('Please select a file');
      return;
    }

    setUploadingFile(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `${selectedProject.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      let versionNumber = 1;
      let parentFileId = bouncingFileId;

      if (bouncingFileId) {
        const { data: parentFile } = await supabase
          .from('project_files')
          .select('version_number')
          .eq('id', bouncingFileId)
          .maybeSingle();

        if (parentFile) {
          versionNumber = parentFile.version_number + 1;
        }
      }

      const { error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: selectedProject.id,
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          uploaded_by: currentMusicianId,
          version_number: versionNumber,
          parent_file_id: parentFileId,
          notes: fileNotes,
          is_latest_version: true
        });

      if (dbError) throw dbError;

      toast.success(bouncingFileId ? `New version (v${versionNumber}) uploaded!` : 'File uploaded successfully!');
      setSelectedFile(null);
      setFileNotes('');
      setBouncingFileId(null);
      await loadProjectFiles(selectedProject.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const downloadFile = async (file: ProjectFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to download file');
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
      if (selectedProject) await loadProjectFiles(selectedProject.id);
    } catch (error: any) {
      toast.error('Failed to delete file');
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedProject) {
      toast.error('Please enter a comment');
      return;
    }

    const { error } = await supabase
      .from('project_comments')
      .insert({
        project_id: selectedProject.id,
        file_id: commentFileId,
        musician_id: currentMusicianId,
        comment_text: newComment
      });

    if (error) {
      toast.error('Failed to add comment');
      return;
    }

    toast.success('Comment added');
    setNewComment('');
    setCommentFileId(null);
    await loadProjectComments(selectedProject.id);
  };

  const searchMusicians = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setAvailableMusicians([]);
      setShowMusicianList(false);
      return;
    }

    setIsSearching(true);
    setShowMusicianList(true);

    // Get current collaborator IDs to exclude them from search
    const currentCollaboratorIds = selectedProject?.collaborators?.map(c => c.musician_id) || [];

    const { data, error } = await supabase
      .from('musician_profiles')
      .select('id, full_name, email, role, profile_photo_url, bio')
      .eq('is_verified', true)
      .eq('is_active', true)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .not('id', 'in', `(${currentCollaboratorIds.length > 0 ? currentCollaboratorIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
      .limit(10);

    if (!error && data) {
      setAvailableMusicians(data);
    } else {
      setAvailableMusicians([]);
    }

    setIsSearching(false);
  };

  const addCollaborator = async (musicianId?: string, musicianEmail?: string) => {
    if (!selectedProject) {
      toast.error('No project selected');
      return;
    }

    let musician: { id: string } | null = null;
    
    if (musicianId) {
      // Adding from search results
      const { data } = await supabase
        .from('musician_profiles')
        .select('id')
        .eq('id', musicianId)
        .maybeSingle();
      musician = data;
    } else if (musicianEmail || collaboratorEmail) {
      // Adding by email (legacy method)
      const email = musicianEmail || collaboratorEmail;
      if (!email.trim()) {
        toast.error('Please enter an email or select a musician');
        return;
      }

      const { data } = await supabase
        .from('musician_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      musician = data;
    } else {
      toast.error('Please enter an email or select a musician');
      return;
    }

    if (!musician) {
      toast.error('Musician not found');
      return;
    }

    // Check if already a collaborator
    const isAlreadyCollaborator = selectedProject.collaborators?.some(
      c => c.musician_id === musician!.id
    );

    if (isAlreadyCollaborator) {
      toast.error('This musician is already a collaborator');
      return;
    }

    const { error } = await supabase
      .from('project_collaborators')
      .insert({
        project_id: selectedProject.id,
        musician_id: musician.id,
        role: 'collaborator',
        can_upload: true,
        can_delete: false
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('This musician is already a collaborator');
      } else {
        toast.error(`Failed to add collaborator: ${error.message}`);
      }
      return;
    }

    toast.success('Collaborator added successfully');
    setCollaboratorEmail('');
    setSearchQuery('');
    setAvailableMusicians([]);
    setShowMusicianList(false);
    await loadCollaborators(selectedProject.id);
  };

  const deleteProject = async () => {
    if (!selectedProject) {
      toast.error('No project selected');
      return;
    }

    // Check if user is owner
    if (selectedProject.role !== 'owner') {
      toast.error('Only project owners can delete projects');
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${selectedProject.project_name}"? This action cannot be undone and will delete all files, comments, and project data.`)) {
      return;
    }

    await handleDeleteProject(selectedProject.id);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      // First, get all files for this project to delete from storage
      const { data: files } = await supabase
        .from('project_files')
        .select('file_path')
        .eq('project_id', projectId);

      // Delete files from storage if any exist
      if (files && files.length > 0) {
        const filePaths = files.map(f => f.file_path);
        const { error: storageError } = await supabase.storage
          .from('project-files')
          .remove(filePaths);

        if (storageError) {
          console.warn('Error deleting files from storage:', storageError);
          // Continue with project deletion even if storage cleanup fails
        }
      }

      // Delete the project - this will cascade delete all related data
      const { error } = await supabase
        .from('collaboration_projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        throw error;
      }

      toast.success('Project deleted successfully');
      
      // Clear selected project if it was the deleted one
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      
      await loadProjects();
    } catch (error: any) {
      console.error('Project deletion error:', error);
      toast.error(`Failed to delete project: ${error.message || 'Unknown error'}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('audio/')) return <FileAudio className="h-5 w-5" />;
    if (fileType.startsWith('image/')) return <FileText className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const isAudioFile = (fileType: string) => {
    return fileType.startsWith('audio/');
  };

  // Get color coding for projects based on recency (newest to oldest)
  const getProjectColorClass = (index: number, total: number) => {
    // Create a gradient from vibrant to muted colors
    // Newest projects get vibrant colors, oldest get muted
    const colors = [
      'bg-gold/15 border-gold/50 hover:bg-gold/20 border-l-4 border-l-gold',           // Newest - Gold
      'bg-teal/15 border-teal/50 hover:bg-teal/20 border-l-4 border-l-teal',           // Second - Teal
      'bg-coral/15 border-coral/50 hover:bg-coral/20 border-l-4 border-l-coral',         // Third - Coral
      'bg-sky/15 border-sky/50 hover:bg-sky/20 border-l-4 border-l-sky',              // Fourth - Sky
      'bg-gold/10 border-gold/30 hover:bg-gold/15 border-l-2 border-l-gold/70',           // Fifth - Muted Gold
      'bg-teal/10 border-teal/30 hover:bg-teal/15 border-l-2 border-l-teal/70',            // Sixth - Muted Teal
      'bg-coral/10 border-coral/30 hover:bg-coral/15 border-l-2 border-l-coral/70',          // Seventh - Muted Coral
      'bg-sky/10 border-sky/30 hover:bg-sky/15 border-l-2 border-l-sky/70',               // Eighth - Muted Sky
    ];
    
    // For projects beyond 8, cycle through muted versions
    if (index < colors.length) {
      return colors[index];
    }
    
    // For very old projects, use a very muted secondary color
    const mutedIndex = (index % 4) + 4; // Cycle through muted colors 4-7
    return colors[mutedIndex];
  };

  const handlePlayAudio = (file: ProjectFile) => {
    if (currentTrack?.id === file.id && isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentTrack({
        id: file.id,
        fileName: file.file_name,
        filePath: file.file_path,
        uploaderName: file.uploader?.full_name || 'Unknown',
      });
      setIsPlaying(true);
    }
  };

  // Function to convert URLs in text to clickable links
  const renderMessageWithLinks = (text: string) => {
    // URL regex pattern - matches http, https, www, and common domains
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    // Split text by newlines first to preserve line breaks
    const processTextSegment = (segment: string, isUrl: boolean = false) => {
      if (isUrl) {
        let url = segment;
        // Add https:// if the URL doesn't have a protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        return (
          <a
            key={`link-${keyCounter++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80 break-all font-medium"
            style={{ 
              color: 'inherit',
              textDecorationColor: 'currentColor',
              textDecorationThickness: '1.5px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {segment}
          </a>
        );
      }
      return segment;
    };

    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index);
        parts.push(textBefore);
      }

      // Add the URL as a clickable link
      parts.push(processTextSegment(match[0], true));

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last URL
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // If no URLs were found, return the original text
    if (parts.length === 0) {
      return text;
    }

    return parts;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Music2 className="h-12 w-12 text-gold animate-pulse mx-auto mb-4" />
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Collaborative Projects</h2>
          <p className="text-muted-foreground">Work together on music projects, share files, and bounce tracks</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-background hover:bg-gold/90">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Start a new collaborative music project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Summer EP 2024"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Describe your project goals and vision..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={newProjectGenre}
                    onChange={(e) => setNewProjectGenre(e.target.value)}
                    placeholder="Jazz, R&B, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newProjectDeadline}
                    onChange={(e) => setNewProjectDeadline(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={createProject} className="w-full bg-gold text-background hover:bg-gold/90">
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="bg-secondary/30">
          <CardContent className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first collaborative project or wait for collaboration invites
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-3">Your Projects</h3>
              <ScrollArea className="h-[300px] pr-4">
                {projects
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((project, index) => (
                  <Card
                    key={project.id}
                    className={`mb-3 cursor-pointer transition-all ${
                      selectedProject?.id === project.id
                        ? 'bg-gold/20 border-gold shadow-lg'
                        : getProjectColorClass(index, projects.length)
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{project.project_name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {project.genre || 'No genre'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {project.role}
                          </Badge>
                          {project.role === 'owner' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete "${project.project_name}"? This action cannot be undone.`)) {
                                  handleDeleteProject(project.id);
                                }
                              }}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-600/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </div>

            {selectedProject && (
              <Card className="bg-secondary/30 border-gold/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gold" />
                    Live Chat
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedProject.project_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-col h-[400px]">
                    <ScrollArea className="flex-1 px-4">
                      <div className="space-y-2 py-2">
                        {chatMessages.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">No messages yet</p>
                          </div>
                        ) : (
                          chatMessages.map((message) => {
                            const isOwnMessage = message.musician_id === currentMusicianId;
                            return (
                              <div
                                key={message.id}
                                className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                              >
                                {!isOwnMessage && (
                                  <Avatar className="h-7 w-7 flex-shrink-0">
                                    <AvatarImage src={message.musician?.profile_photo_url} />
                                    <AvatarFallback className="bg-gold/20 text-gold text-xs">
                                      {message.musician?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                  {!isOwnMessage && (
                                    <span className="text-xs font-medium mb-1 px-1">
                                      {message.musician?.full_name}
                                    </span>
                                  )}
                                  <div
                                    className={`rounded-2xl px-3 py-2 ${
                                      isOwnMessage
                                        ? 'bg-gold text-background'
                                        : 'bg-secondary'
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                      {renderMessageWithLinks(message.message_text)}
                                    </p>
                                  </div>
                                  <span className="text-xs text-muted-foreground mt-1 px-1">
                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {isOwnMessage && (
                                  <Avatar className="h-7 w-7 flex-shrink-0">
                                    <AvatarImage src={currentMusicianProfile?.profile_photo_url} />
                                    <AvatarFallback className="bg-gold/20 text-gold text-xs">
                                      {currentMusicianProfile?.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                    <div className="p-3 border-t border-border">
                      <div className="flex gap-2">
                        <Input
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder="Aa"
                          className="rounded-full bg-secondary border-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendChatMessage();
                            }
                          }}
                        />
                        <Button
                          onClick={sendChatMessage}
                          size="icon"
                          className="rounded-full bg-gold text-background hover:bg-gold/90 flex-shrink-0"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {selectedProject && (
            <div className="lg:col-span-2">
              <Card className="bg-secondary/30">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{selectedProject.project_name}</CardTitle>
                      <CardDescription className="mt-2">
                        {selectedProject.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gold/20 text-gold">
                        {selectedProject.status}
                      </Badge>
                      {selectedProject.role === 'owner' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject();
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Project
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="files" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="files">Files</TabsTrigger>
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                      <TabsTrigger value="team">Team</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="files" className="space-y-4">
                      {selectedProject.can_upload && (
                        <Card className="bg-background/50">
                          <CardHeader>
                            <CardTitle className="text-sm">Upload File</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {bouncingFileId && (
                              <div className="flex items-center gap-2 p-2 bg-gold/10 rounded border border-gold/50">
                                <History className="h-4 w-4 text-gold" />
                                <span className="text-sm">Creating new version of file</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setBouncingFileId(null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            <div>
                              <Input
                                type="file"
                                onChange={handleFileSelect}
                                accept="audio/*,image/*,video/*,.pdf,.zip"
                              />
                            </div>
                            <div>
                              <Label>Notes (optional)</Label>
                              <Textarea
                                value={fileNotes}
                                onChange={(e) => setFileNotes(e.target.value)}
                                placeholder="Add notes about this version..."
                                rows={2}
                              />
                            </div>
                            <Button
                              onClick={uploadFile}
                              disabled={!selectedFile || uploadingFile}
                              className="w-full bg-gold text-background hover:bg-gold/90"
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              {uploadingFile ? 'Uploading...' : 'Upload File'}
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {projectFiles.length === 0 ? (
                            <div className="text-center py-12">
                              <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No files uploaded yet</p>
                            </div>
                          ) : (
                            projectFiles.map((file) => (
                              <Card key={file.id} className="bg-background/50">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="text-gold mt-1">
                                        {getFileIcon(file.file_type)}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold">{file.file_name}</h4>
                                          {file.is_latest_version && (
                                            <Badge variant="outline" className="text-xs border-gold/50 text-gold">
                                              v{file.version_number}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Uploaded by {file.uploader?.full_name} • {formatFileSize(file.file_size)}
                                        </p>
                                        {file.notes && (
                                          <p className="text-sm mt-2 p-2 bg-secondary/50 rounded">
                                            {file.notes}
                                          </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-2">
                                          {new Date(file.created_at).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {isAudioFile(file.file_type) && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handlePlayAudio(file)}
                                          className={
                                            currentTrack?.id === file.id && isPlaying
                                              ? 'border-gold text-gold hover:bg-gold/10'
                                              : ''
                                          }
                                        >
                                          {currentTrack?.id === file.id && isPlaying ? (
                                            <Pause className="h-4 w-4" />
                                          ) : (
                                            <Play className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadFile(file)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      {selectedProject.can_upload && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setBouncingFileId(file.id);
                                            toast.info('Select a new file to create the next version');
                                          }}
                                        >
                                          <History className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {selectedProject.can_delete && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => deleteFile(file.id, file.file_path)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="comments" className="space-y-4">
                      <Card className="bg-background/50">
                        <CardContent className="p-4 space-y-3">
                          <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment to the project..."
                            rows={3}
                          />
                          <Button
                            onClick={addComment}
                            className="w-full bg-gold text-background hover:bg-gold/90"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Post Comment
                          </Button>
                        </CardContent>
                      </Card>

                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {projectComments.length === 0 ? (
                            <div className="text-center py-12">
                              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No comments yet</p>
                            </div>
                          ) : (
                            projectComments.map((comment) => (
                              <Card key={comment.id} className="bg-background/50">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={comment.musician?.profile_photo_url} />
                                      <AvatarFallback className="bg-gold/20 text-gold text-xs">
                                        {comment.musician?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-sm">{comment.musician?.full_name}</h4>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(comment.created_at).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-sm mt-1">{comment.comment_text}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="team" className="space-y-4">
                      {selectedProject.role === 'owner' && (
                        <Card className="bg-background/50">
                          <CardHeader>
                            <CardTitle className="text-sm">Add Collaborator</CardTitle>
                            <CardDescription className="text-xs">
                              Search by name or email to find musicians to add
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="relative" ref={searchDropdownRef}>
                              <Input
                                value={searchQuery}
                                onChange={(e) => {
                                  setSearchQuery(e.target.value);
                                  searchMusicians(e.target.value);
                                }}
                                onFocus={() => {
                                  if (searchQuery.length >= 2 && availableMusicians.length > 0) {
                                    setShowMusicianList(true);
                                  }
                                }}
                                placeholder="Search by name or email..."
                                className="pr-10"
                              />
                              {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                                </div>
                              )}
                              
                              {showMusicianList && availableMusicians.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {availableMusicians.map((musician) => (
                                    <div
                                      key={musician.id}
                                      className="p-3 hover:bg-secondary/50 cursor-pointer border-b border-border last:border-b-0"
                                      onClick={() => addCollaborator(musician.id)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={musician.profile_photo_url} />
                                          <AvatarFallback className="bg-gold/20 text-gold text-xs">
                                            {musician.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">{musician.full_name}</p>
                                          <p className="text-xs text-muted-foreground truncate">{musician.role} • {musician.email}</p>
                                        </div>
                                        <Plus className="h-4 w-4 text-gold flex-shrink-0" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {showMusicianList && searchQuery.length >= 2 && !isSearching && availableMusicians.length === 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg p-3">
                                  <p className="text-sm text-muted-foreground">No musicians found</p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-px bg-border" />
                              <span className="text-xs text-muted-foreground">OR</span>
                              <div className="flex-1 h-px bg-border" />
                            </div>

                            <div className="space-y-2">
                              <Input
                                value={collaboratorEmail}
                                onChange={(e) => setCollaboratorEmail(e.target.value)}
                                placeholder="Enter musician's email directly"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addCollaborator(undefined, collaboratorEmail);
                                  }
                                }}
                              />
                              <Button
                                onClick={(e) => {
                                  e.preventDefault();
                                  addCollaborator(undefined, collaboratorEmail);
                                }}
                                className="w-full bg-gold text-background hover:bg-gold/90"
                                disabled={!collaboratorEmail.trim()}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add by Email
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="space-y-3">
                        {selectedProject.collaborators?.map((collab) => (
                          <Card key={collab.id} className="bg-background/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border-2 border-gold">
                                    <AvatarImage src={collab.musician?.profile_photo_url} />
                                    <AvatarFallback className="bg-gold/20 text-gold">
                                      {collab.musician?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-semibold">{collab.musician?.full_name}</h4>
                                    <p className="text-sm text-muted-foreground">{collab.musician?.role}</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="border-gold/50">
                                  {collab.role}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="activity">
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-3">
                          {activityLog.length === 0 ? (
                            <div className="text-center py-12">
                              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No activity yet</p>
                            </div>
                          ) : (
                            activityLog.map((activity) => (
                              <Card key={activity.id} className="bg-background/50">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-gold mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm">
                                        <span className="font-semibold">{activity.musician?.full_name}</span>{' '}
                                        {activity.activity_type.replace('_', ' ')}
                                        {activity.activity_data?.file_name && (
                                          <span className="text-gold"> {activity.activity_data.file_name}</span>
                                        )}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(activity.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
      <AudioPlayer />
    </div>
  );
}

export default function CollaborativeProjects(props: CollaborativeProjectsProps) {
  return (
    <AudioPlayerProvider>
      <CollaborativeProjectsInner {...props} />
    </AudioPlayerProvider>
  );
}

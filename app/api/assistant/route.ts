import OpenAI from 'openai';
import { searchInventory, addToCart, fetchWebSpecs } from '@/lib/ai-actions';

export async function POST(req: Request) {
  try {
    // Check environment variables first
    const apiKey = process.env.OPENAI_API_KEY;
    const assistantId = process.env.OPENAI_ASSISTANT_ID;

    if (!assistantId) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI Assistant ID not configured. Please set OPENAI_ASSISTANT_ID environment variable.' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize OpenAI client after validating environment variables
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Parse and validate request body
    let input: {
      threadId?: string;
      message: string;
    };
    
    try {
      input = await req.json();
    } catch (error: any) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body. Expected JSON with message field.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!input.message || typeof input.message !== 'string' || input.message.trim() === '') {
      return new Response(
        JSON.stringify({ 
          error: 'Message field is required and must be a non-empty string.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create or retrieve the thread
          let currentThreadId: string | undefined = input.threadId;
          
          // Validate existing thread ID if provided
          if (currentThreadId) {
            currentThreadId = currentThreadId.trim();
            if (currentThreadId === '' || currentThreadId === 'undefined' || currentThreadId === 'null') {
              currentThreadId = undefined;
            }
          }

          // Create new thread if needed
          if (!currentThreadId) {
            try {
              const thread = await openai.beta.threads.create();
              if (!thread || !thread.id || thread.id.trim() === '') {
                throw new Error('Failed to create thread: invalid thread ID returned');
              }
              currentThreadId = thread.id.trim();
              // Send thread ID to client
              controller.enqueue(
                encoder.encode(`0:${JSON.stringify({ type: 'thread', threadId: currentThreadId })}\n`)
              );
            } catch (error: any) {
              console.error('Error creating thread:', error);
              throw new Error(`Failed to create thread: ${error.message || 'Unknown error'}`);
            }
          }

          // Final validation - thread ID must be valid before proceeding
          if (!currentThreadId || currentThreadId.trim() === '') {
            throw new Error('Invalid thread ID: thread ID is required but was not provided or is empty');
          }

          // Check for active runs - but don't block too long
          // If there's an active run, we'll handle it with retry logic below
          try {
            const threadIdForCheck = currentThreadId.trim();
            const runs = await openai.beta.threads.runs.list(threadIdForCheck, { limit: 1, order: 'desc' });
            const activeRun = runs.data.find((run: any) => 
              run.status === 'queued' || run.status === 'in_progress'
            );

            if (activeRun) {
              console.log(`Found active run ${activeRun.id} with status ${activeRun.status}, will retry if needed`);
              // Don't wait here - let the retry logic below handle it more efficiently
            }
          } catch (runCheckError: any) {
            console.warn('Error checking for active runs:', runCheckError.message);
            // Continue anyway - retry logic will handle conflicts
          }

          // Add the user's message to the thread
          // Retry with backoff in case there's still a race condition
          let retries = 0;
          const maxRetries = 3;
          
          while (retries <= maxRetries) {
            try {
              await openai.beta.threads.messages.create(currentThreadId, {
                role: 'user',
                content: input.message.trim(),
              });
              break; // Success, exit retry loop
            } catch (error: any) {
              console.log(`Attempt ${retries + 1} to add message failed:`, {
                status: error.status,
                message: error.message,
                error: error.error?.message || error.error,
              });
              
              // Check if this is an active run error
              const errorMsg = (error.message || error.error?.message || '').toLowerCase();
              const isActiveRunError = errorMsg.includes('active') && errorMsg.includes('run');
              
              if (isActiveRunError && retries < maxRetries) {
                retries++;
                // Reduced wait times: 500ms, 1000ms, 1500ms instead of 1s, 2s, 3s
                const waitTime = 500 * retries;
                console.log(`Active run still blocking, waiting ${waitTime}ms before retry...`);
                
                // Wait for the run to complete
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              } else {
                // Re-throw with better error message for 400 errors
                if (error.status === 400) {
                  const apiError = error.error?.message || error.message || 'Invalid request to OpenAI API';
                  throw new Error(`Bad request (400): ${apiError}`);
                }
                throw error; // Re-throw other errors
              }
            }
          }

          // Helper to stream completed message content
          const streamCompletedMessage = async (threadId: string) => {
            const messages = await openai.beta.threads.messages.list(threadId, { limit: 1, order: 'desc' });
            const assistantMessage = messages.data[0];
            if (assistantMessage?.content) {
              for (const content of assistantMessage.content) {
                if (content.type === 'text' && 'text' in content) {
                  const textValue = content.text.value;
                  // Stream in larger chunks for better performance (200 chars instead of 50)
                  const chunkSize = 200;
                  for (let i = 0; i < textValue.length; i += chunkSize) {
                    const chunk = textValue.slice(i, i + chunkSize);
                    controller.enqueue(
                      encoder.encode(`0:${JSON.stringify({ type: 'text', text: chunk })}\n`)
                    );
                  }
                }
              }
            }
            controller.enqueue(encoder.encode(`0:${JSON.stringify({ type: 'done' })}\n`));
          };

          // Helper to process tool calls and submit outputs
          const processToolCalls = async (toolCalls: any[], threadId: string, runId: string) => {
            const toolOutputs = await Promise.all(
              toolCalls.map(async (toolCall: any) => {
                const { id, function: functionCall } = toolCall;
                const { name, arguments: args } = functionCall;

                try {
                  let result: any;

                  switch (name) {
                    case 'searchInventory':
                    case 'search_inventory': {
                      const { query } = JSON.parse(args);
                      console.log(`🔍 searchInventory called with query: "${query}"`);
                      const products = await searchInventory(query);
                      
                      result = {
                        success: true,
                        products: products,
                        count: products.length,
                        query: query,
                        message: products.length > 0 
                          ? `Found ${products.length} product(s) matching "${query}"`
                          : `No products found matching "${query}". The inventory may be empty or the search term may not match any products.`,
                      };
                      
                      console.log(`✅ searchInventory result: ${products.length} products found`);
                      controller.enqueue(
                        encoder.encode(`0:${JSON.stringify({ type: 'search-results', products, count: products.length })}\n`)
                      );
                      break;
                    }
                    case 'addToCart': {
                      const { productId, quantity } = JSON.parse(args);
                      const cartResult = await addToCart(productId, quantity);
                      result = cartResult;
                      controller.enqueue(
                        encoder.encode(`0:${JSON.stringify({
                          type: 'cart-update',
                          success: cartResult.success,
                          message: cartResult.message,
                        })}\n`)
                      );
                      break;
                    }
                    case 'fetchWebSpecs': {
                      const { query } = JSON.parse(args);
                      const webSpecsResult = await fetchWebSpecs(query);
                      result = webSpecsResult;
                      // Send web specs results to client
                      controller.enqueue(
                        encoder.encode(`0:${JSON.stringify({
                          type: 'web-specs-results',
                          success: webSpecsResult.success,
                          results: webSpecsResult.results,
                          answer: webSpecsResult.answer,
                        })}\n`)
                      );
                      break;
                    }
                    default:
                      console.error(`❌ Unknown tool name: "${name}"`);
                      console.error(`❌ Available tools: searchInventory/search_inventory, addToCart, fetchWebSpecs`);
                      console.error(`❌ Tool call data:`, JSON.stringify({ id, name, args }, null, 2));
                      result = {
                        success: false,
                        error: `Unknown tool: ${name}. Available tools: searchInventory/search_inventory, addToCart, fetchWebSpecs`,
                      };
                  }

                  console.log(`✅ Tool ${name} completed successfully`);
                  return {
                    tool_call_id: id,
                    output: JSON.stringify(result),
                  };
                } catch (error: any) {
                  console.error(`❌ Error executing tool ${name}:`, error);
                  console.error(`❌ Error stack:`, error.stack);
                  return {
                    tool_call_id: id,
                    output: JSON.stringify({
                      success: false,
                      error: error.message || 'Tool execution failed',
                    }),
                  };
                }
              })
            );

            console.log(`🔧 Processed ${toolOutputs.length} tool output(s)`);
            return toolOutputs;
          };

          // Helper to process a run and handle tool calls
          const processRunStream = async (threadIdParam: string) => {
            const threadId = threadIdParam.trim();
            if (!threadId || threadId === 'undefined' || threadId === 'null') {
              throw new Error(`Invalid thread ID provided to processRunStream: ${threadIdParam}`);
            }
            console.log(`Starting processRunStream with threadId: ${threadId}`);

            // Send immediate "thinking" indicator to show processing has started
            controller.enqueue(
              encoder.encode(`0:${JSON.stringify({ type: 'thinking', status: true })}\n`)
            );

            const runStream = openai.beta.threads.runs.createAndStream(threadId, {
              assistant_id: assistantId,
            });

            for await (const event of runStream) {
              // Forward text deltas
              if (event.event === 'thread.message.delta' && event.data.delta) {
                const delta = event.data.delta;
                if (delta.content && Array.isArray(delta.content)) {
                  for (const content of delta.content) {
                    if (content.type === 'text' && content.text?.value) {
                      controller.enqueue(
                        encoder.encode(`0:${JSON.stringify({ type: 'text', text: content.text.value })}\n`)
                      );
                    }
                  }
                }
              }

              // Handle tool calls
              if (event.event === 'thread.run.requires_action') {
                console.log(`🔧 Received requires_action event`);
                const runData = event.data as any;
                const requiredAction = runData.required_action;

                if (
                  requiredAction?.type === 'submit_tool_outputs' &&
                  requiredAction.submit_tool_outputs?.tool_calls
                ) {
                  const toolCalls = requiredAction.submit_tool_outputs.tool_calls;
                  console.log(`🔧 Tool calls required: ${toolCalls.length} tool(s)`);
                  console.log(`🔧 Tool call names:`, toolCalls.map((tc: any) => tc.function?.name));
                  
                  // Extract run ID - should be in runData.id
                  let runId = runData.id;
                  
                  // Extract thread ID - MUST use runData.thread_id if available, as SDK may use it internally
                  // The runData object should contain thread_id field
                  let runThreadId: string;
                  
                  if (runData.thread_id && typeof runData.thread_id === 'string' && runData.thread_id.trim() !== '') {
                    runThreadId = runData.thread_id.trim();
                  } else if (threadId && typeof threadId === 'string' && threadId.trim() !== '' && threadId !== 'undefined' && threadId !== 'null') {
                    runThreadId = threadId.trim();
                  } else {
                    console.error('Invalid thread ID when processing tool calls:', {
                      runDataThreadId: runData.thread_id,
                      runDataThreadIdType: typeof runData.thread_id,
                      functionThreadId: threadId,
                      functionThreadIdType: typeof threadId,
                      runDataKeys: runData ? Object.keys(runData) : 'no runData',
                    });
                    throw new Error(`Invalid thread ID: thread ID is missing from both run data (${runData.thread_id}) and function scope (${threadId})`);
                  }
                  
                  // Validate run ID - ensure it's actually a run ID (starts with 'run_')
                  if (!runId || typeof runId !== 'string' || runId.trim() === '') {
                    console.error('Invalid run ID when processing tool calls:', {
                      runId,
                      runIdType: typeof runId,
                      runDataKeys: runData ? Object.keys(runData) : 'no data',
                    });
                    throw new Error(`Invalid run ID: ${runId}. Run data structure may be incorrect.`);
                  }
                  
                  // Ensure run ID starts with 'run_' (OpenAI run IDs always start with 'run_')
                  if (!runId.trim().startsWith('run_')) {
                    console.error('Run ID does not start with "run_":', runId);
                    throw new Error(`Invalid run ID format: ${runId}. Expected run ID to start with "run_"`);
                  }
                  
                  runId = runId.trim();
                  
                  console.log(`Processing tool calls - threadId: ${runThreadId}, runId: ${runId}`);

                  const toolOutputs = await processToolCalls(toolCalls, runThreadId, runId);

                  try {
                    console.log(`Submitting tool outputs - threadId: "${runThreadId}", runId: "${runId}"`);
                    const submitResponse = await fetch(
                      `https://api.openai.com/v1/threads/${runThreadId}/runs/${runId}/submit_tool_outputs`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${apiKey}`,
                          'OpenAI-Beta': 'assistants=v2',
                        },
                        body: JSON.stringify({
                          tool_outputs: toolOutputs,
                        }),
                      }
                    );
                    
                    if (!submitResponse.ok) {
                      const errorData = await submitResponse.json().catch(() => ({ error: { message: submitResponse.statusText } }));
                      throw new Error(`Failed to submit tool outputs: ${errorData.error?.message || submitResponse.statusText}`);
                    }
                    
                    const submitResult = await submitResponse.json();
                    
                    console.log(`Tool outputs submitted successfully, run status: ${submitResult.status}`);
                    
                    // Poll the run until it completes or requires more action
                    let currentRun: any = submitResult;
                    const maxPollAttempts = 100; // Increased attempts but with faster polling
                    let pollAttempts = 0;
                    
                    // Use faster polling interval (200ms instead of 500ms) for better responsiveness
                    while ((currentRun.status === 'queued' || currentRun.status === 'in_progress') && pollAttempts < maxPollAttempts) {
                      await new Promise(resolve => setTimeout(resolve, 200));
                      const retrieveResponse = await fetch(
                        `https://api.openai.com/v1/threads/${runThreadId}/runs/${runId}`,
                        {
                          method: 'GET',
                          headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'OpenAI-Beta': 'assistants=v2',
                          },
                        }
                      );
                      if (!retrieveResponse.ok) {
                        throw new Error(`Failed to retrieve run: ${retrieveResponse.statusText}`);
                      }
                      currentRun = await retrieveResponse.json();
                      pollAttempts++;
                      if (pollAttempts % 10 === 0) {
                        console.log(`Polling run ${runId}, status: ${currentRun.status}, attempt ${pollAttempts}`);
                      }
                    }
                    
                    if (currentRun.status === 'completed') {
                      await streamCompletedMessage(runThreadId);
                      return;
                    }
                    
                    // If run requires more action, recursively process it (max 3 levels deep)
                    if (currentRun.status === 'requires_action' && currentRun.required_action) {
                      const additionalAction = currentRun.required_action;
                      if (additionalAction.type === 'submit_tool_outputs' && additionalAction.submit_tool_outputs?.tool_calls) {
                        console.log(`Run requires additional tool calls, processing recursively...`);
                        const additionalRunId = currentRun.id?.trim() || runId;
                        if (!additionalRunId || !additionalRunId.startsWith('run_')) {
                          throw new Error(`Invalid run ID for recursive tool call: ${additionalRunId}`);
                        }
                        console.log(`Recursive tool call - using threadId: "${runThreadId}", runId: "${additionalRunId}"`);
                        const additionalToolOutputs = await processToolCalls(
                          additionalAction.submit_tool_outputs.tool_calls,
                          runThreadId,
                          additionalRunId
                        );
                        const additionalSubmitResponse = await fetch(
                          `https://api.openai.com/v1/threads/${runThreadId}/runs/${additionalRunId}/submit_tool_outputs`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${apiKey}`,
                              'OpenAI-Beta': 'assistants=v2',
                            },
                            body: JSON.stringify({
                              tool_outputs: additionalToolOutputs,
                            }),
                          }
                        );
                        
                        if (!additionalSubmitResponse.ok) {
                          const errorData = await additionalSubmitResponse.json().catch(() => ({ error: { message: additionalSubmitResponse.statusText } }));
                          throw new Error(`Failed to submit additional tool outputs: ${errorData.error?.message || additionalSubmitResponse.statusText}`);
                        }
                        
                        const additionalSubmitResult = await additionalSubmitResponse.json();
                        currentRun = additionalSubmitResult;
                        pollAttempts = 0;
                        
                        while ((currentRun.status === 'queued' || currentRun.status === 'in_progress' || currentRun.status === 'requires_action') && pollAttempts < maxPollAttempts) {
                          await new Promise(resolve => setTimeout(resolve, 200));
                          const retrieveResponse2 = await fetch(
                            `https://api.openai.com/v1/threads/${runThreadId}/runs/${additionalRunId}`,
                            {
                              method: 'GET',
                              headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'OpenAI-Beta': 'assistants=v2',
                              },
                            }
                          );
                          if (!retrieveResponse2.ok) {
                            throw new Error(`Failed to retrieve run: ${retrieveResponse2.statusText}`);
                          }
                          currentRun = await retrieveResponse2.json();
                          pollAttempts++;
                          
                          // If run requires more action, handle it recursively (only one level deep for nested calls)
                          if (currentRun.status === 'requires_action' && currentRun.required_action && pollAttempts < maxPollAttempts) {
                            const nestedAction = currentRun.required_action;
                            if (nestedAction.type === 'submit_tool_outputs' && nestedAction.submit_tool_outputs?.tool_calls) {
                              console.log(`Nested recursive tool call detected, processing...`);
                              const nestedToolOutputs = await processToolCalls(
                                nestedAction.submit_tool_outputs.tool_calls,
                                runThreadId,
                                additionalRunId
                              );
                              const nestedSubmitResponse = await fetch(
                                `https://api.openai.com/v1/threads/${runThreadId}/runs/${additionalRunId}/submit_tool_outputs`,
                                {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${apiKey}`,
                                    'OpenAI-Beta': 'assistants=v2',
                                  },
                                  body: JSON.stringify({
                                    tool_outputs: nestedToolOutputs,
                                  }),
                                }
                              );
                              if (nestedSubmitResponse.ok) {
                                currentRun = await nestedSubmitResponse.json();
                                pollAttempts = 0; // Reset for new polling cycle
                              }
                            }
                          }
                        }
                        
                        if (currentRun.status === 'completed') {
                          await streamCompletedMessage(runThreadId);
                        } else {
                          controller.enqueue(encoder.encode(`0:${JSON.stringify({ type: 'done' })}\n`));
                        }
                        return;
                      }
                    }
                    
                    if (pollAttempts >= maxPollAttempts) {
                      console.warn(`Timeout polling run ${runId} after ${maxPollAttempts} attempts`);
                    }
                    controller.enqueue(
                      encoder.encode(`0:${JSON.stringify({ type: 'done' })}\n`)
                    );
                    return;
                  } catch (toolError: any) {
                    console.error('Error submitting tool outputs:', toolError);
                    controller.enqueue(
                      encoder.encode(`0:${JSON.stringify({ 
                        type: 'error', 
                        error: toolError.message || 'Error processing tool outputs' 
                      })}\n`)
                    );
                    return;
                  }
                }
              }

              // Handle run completion
              if (event.event === 'thread.run.completed') {
                controller.enqueue(
                  encoder.encode(`0:${JSON.stringify({ type: 'done' })}\n`)
                );
              }
            }
          };

          await processRunStream(currentThreadId);
        } catch (error: any) {
          console.error('Error processing assistant request:', error);
          
          let errorMessage = error.message || 'Internal server error';
          
          if (error.status === 400) {
            errorMessage = `Bad request: ${error.message || 'Invalid request to OpenAI API'}`;
          } else if (error.status === 401) {
            errorMessage = 'Authentication failed. Please check your API key.';
          } else if (error.status === 404) {
            errorMessage = 'Assistant not found. Please check your Assistant ID.';
          } else if (error.status === 429) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
          } else if (error.status === 500 || error.status === 502 || error.status === 503) {
            errorMessage = 'OpenAI service is temporarily unavailable. Please try again later.';
          }
          
          controller.enqueue(
            encoder.encode(`0:${JSON.stringify({ type: 'error', error: errorMessage })}\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in assistant route:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
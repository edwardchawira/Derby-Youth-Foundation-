# Studio Images Installation Guide

Your website has been updated to use your authentic Pinnacle SSA studio photos instead of stock images. Follow these simple steps to complete the integration.

## What's Been Changed

All stock images have been replaced with references to your actual studio photos on:
- **Homepage**: Hero background and service cards
- **Studio Services page**: Hero and service type cards
- **Call-to-action sections**: Equipment showcase

## Installation Steps

### Step 1: Locate Your Images
Find these 5 WhatsApp images on your device:
- `whatsapp_image_2025-12-11_at_13.00.2.jpeg`
- `whatsapp_image_2025-12-11_at_13.00.26.jpeg`
- `whatsapp_image_2025-12-11_at_13.00.27.jpeg`
- `whatsapp_image_2025-12-11_at_13.00.28.jpeg`
- `whatsapp_image_2025-12-11_at_13.00.39.jpeg`

### Step 2: Rename the Images

Rename each file according to this mapping:

| Original Filename | New Filename |
|-------------------|--------------|
| whatsapp_image_2025-12-11_at_13.00.39.jpeg | studio-atmosphere.jpg |
| whatsapp_image_2025-12-11_at_13.00.26.jpeg | studio-full-room.jpg |
| whatsapp_image_2025-12-11_at_13.00.2.jpeg | studio-keyboard-closeup.jpg |
| whatsapp_image_2025-12-11_at_13.00.27.jpeg | studio-wide-angle.jpg |
| whatsapp_image_2025-12-11_at_13.00.28.jpeg | studio-multi-keyboard.jpg |

### Step 3: Copy to Project
Copy all 5 renamed images to:
```
/project/public/images/
```

This will replace the placeholder files currently there.

### Step 4: View Results
- If dev server is running, refresh your browser
- If not running, start with `npm run dev`
- Your authentic studio photos will now appear throughout the site

## Image Details

### studio-atmosphere.jpg (Purple lighting shot)
- **Usage**: Homepage hero - first thing visitors see
- **Why**: Creates professional, moody atmosphere; purple ties into color scheme
- **Impact**: Strong emotional first impression

### studio-full-room.jpg (Complete studio view)
- **Usage**: Studio Services page hero
- **Why**: Shows complete professional setup, acoustic treatment, equipment quality
- **Impact**: Builds credibility and confidence

### studio-keyboard-closeup.jpg (Synthesizer detail)
- **Usage**: Recording Studio service cards
- **Why**: Highlights professional equipment quality
- **Impact**: Appeals to musicians looking for quality gear

### studio-wide-angle.jpg (Yamaha Motif prominent)
- **Usage**: Rehearsal Space service cards
- **Why**: Shows room layout and space
- **Impact**: Helps clients visualize the rehearsal environment

### studio-multi-keyboard.jpg (Multiple workstations)
- **Usage**: Call-to-action sections
- **Why**: Demonstrates equipment variety
- **Impact**: Shows comprehensive offerings

## Optimization Tips (Optional)

For best performance, consider optimizing images before upload:
- **Format**: JPEG works great for photos
- **Quality**: 80-85% is ideal for web
- **Tools**:
  - Online: [TinyJPG](https://tinyjpg.com/)
  - Mac: ImageOptim
  - Windows: FileOptimizer

## Troubleshooting

**Images not showing?**
1. Check filenames match exactly (case-sensitive)
2. Ensure images are in `/public/images/` folder
3. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
4. Restart dev server

**Images look stretched or wrong aspect ratio?**
- The site uses `bg-cover` which automatically crops/scales
- Original image aspect ratios are preserved
- Try different cropping if needed

## What Happens Next

Once you add the images:
- ✓ Homepage displays your atmospheric studio shot as hero
- ✓ Service cards show actual equipment and space
- ✓ Studio page showcases authentic environment
- ✓ Visitors see real Pinnacle SSA facilities
- ✓ Increased credibility and bookings

## Need Help?

If you run into any issues:
1. Check the detailed README in `/public/images/README.md`
2. Ensure file permissions allow reading
3. Verify images aren't corrupted

---

**Ready?** Just rename and copy those 5 images, and your site will showcase your professional studio!

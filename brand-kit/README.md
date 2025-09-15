# Brand Kit Instructions

## Place Your New Brand Assets Here

Please copy your CSS-Picker-Brand-Kit files to this directory with the following structure:

### Required Files:
- `favicon.svg` - Main favicon (will be converted to PNG)
- `logo-horizontal.svg` - Main horizontal logo
- `icon-16.svg` - Extension icon 16x16
- `icon-32.svg` - Extension icon 32x32
- `icon-48.svg` - Extension icon 48x48
- `icon-128.svg` - Extension icon 128x128

### Optional Files:
- `og-image.png` - Social media sharing image (1200x630)
- `twitter-image.png` - Twitter card image (1200x600)
- `hero-screenshot.png` - Landing page hero image

## Backup
Your original assets are saved in `old-assets/` directory.

## Auto-Replacement
Once you place the new assets here, run the logo replacement command and all instances will be updated automatically across:
- `/assets/`
- `/css_picker/assets/`
- `/backend/static/`
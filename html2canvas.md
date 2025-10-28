# html2canvas — Practical Usage Guide

## 1. Introduction / Documentation Overview
**html2canvas** is a JavaScript library that allows you to take “screenshots” of webpages or parts of a page directly in the browser. It traverses the DOM and renders elements into a `<canvas>`.

- Rebuilds the view from DOM + styles (not a real screenshot).
- **Limitations**:
  - Images must be same-origin or loaded via a proxy.
  - Plugin content (Flash, Java applets) not rendered.
  - CSS support is incomplete.
- **Browser compatibility**: Modern browsers (Promise polyfill required for older).

---

## 2. Getting Started / Installation & Basic Usage

### Installation
```bash
npm install --save html2canvas
```
or
```bash
yarn add html2canvas
```

Or use via CDN:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

### Basic Usage
```html
<div id="capture" style="padding:10px; background:#f5da55">
  <h4 style="color:#000">Hello world!</h4>
</div>

<script src="html2canvas.min.js"></script>
<script>
  html2canvas(document.querySelector("#capture")).then(canvas => {
    document.body.appendChild(canvas);
  });
</script>
```

### ES6 Import Example
```js
import html2canvas from 'html2canvas';

html2canvas(document.body, {
  // options
}).then(canvas => {
  document.body.appendChild(canvas);
});
```

---

## 3. Configuration Options

| Option                  | Default                     | Description                                                         |
|-------------------------|-----------------------------|---------------------------------------------------------------------|
| `allowTaint`            | `false`                     | Allow cross-origin images (can taint canvas)                        |
| `backgroundColor`       | `#ffffff`                   | Background color of the canvas (null for transparent)               |
| `canvas`                | `null`                      | Use an existing canvas                                              |
| `foreignObjectRendering`| `false`                     | Use foreignObject rendering if supported                            |
| `imageTimeout`          | `15000`                     | How long to wait for images                                        |
| `ignoreElements`        | `(el)=>false`               | Predicate function to exclude elements                              |
| `logging`               | `true`                      | Enable debug logging                                                |
| `onclone`               | `null`                      | Callback to modify cloned DOM before rendering                      |
| `proxy`                 | `null`                      | Proxy URL for cross-origin images                                   |
| `removeContainer`       | `true`                      | Remove temporary DOM clones                                        |
| `scale`                 | `window.devicePixelRatio`   | Scaling factor                                                      |
| `width` / `height`      | Element width/height        | Canvas dimensions                                                   |
| `x` / `y`               | Element offsets             | Crop start point                                                    |
| `scrollX` / `scrollY`   | Element scroll positions    | Control scroll offset                                               |

### Example with Options
```js
html2canvas(document.querySelector("#report"), {
  scale: 2,
  backgroundColor: null,
  logging: false,
  onclone: (doc) => {
    doc.querySelector(".ads").style.display = "none";
  }
}).then(canvas => {
  document.body.appendChild(canvas);
});
```

---

## 4. Features / CSS Support

### Supported CSS Examples
- `background-color`, `background-image` (including gradients)
- `border-radius`, `border-style`, `border-width`
- `color`, `font-family`, `font-size`, `font-weight`
- `width`, `height`, `min/max-width/height`
- `opacity`, `padding`, `margin`
- `transform` (limited support)
- `text-align`, `text-decoration`, `text-shadow`
- `white-space`, `z-index`, `display`, `position`, `visibility`

### Unsupported or Partial
- `box-shadow`, `filter`, `mix-blend-mode`
- `object-fit`, `background-blend-mode`, `writing-mode`
- Some complex transforms and advanced font features.

**Note**: Rendering may differ from actual browser rendering when using unsupported features.

---

## 5. FAQ / Common Issues

### Blank or Cut-Off Canvas
- Canvas size is limited by browser/hardware.
- Chrome: max height/width ~ 32,767px; area ~ 268M pixels.
- Firefox allows larger but still limited.
```js
html2canvas(element, {
  windowWidth: element.scrollWidth,
  windowHeight: element.scrollHeight
});
```

### CSS Property Not Rendering
- Not all CSS properties are supported.
- Consider filing a feature request if necessary.

### Using in Browser Extensions
- Prefer native screenshot APIs instead.

### Cross-Origin Images
- Use CORS headers or a proxy to load them properly.

---

## 6. Sample Workflow

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Screenshot Demo</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>
  <div id="content" style="padding:20px;background:#fafafa">
    <h1>Report</h1>
    <p>This is the section we want to capture.</p>
  </div>

  <button id="captureBtn">Download as Image</button>

  <script>
    document.getElementById('captureBtn').addEventListener('click', () => {
      const element = document.getElementById('content');
      html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        onclone: (doc) => {
          const btn = doc.getElementById('captureBtn');
          if (btn) btn.style.display = 'none';
        }
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'report.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        console.error('Screenshot failed:', err);
      });
    });
  </script>
</body>
</html>
```

---

## 7. When Not to Use html2canvas
- If the target element is extremely large and may exceed canvas limits.
- If capturing protected cross-origin content without proxy.
- On low-power devices where rendering may be slow or fail.

---

## References
- [Official html2canvas site](https://html2canvas.hertzen.com)
- [GitHub Repository](https://github.com/niklasvh/html2canvas)
- [CDNJS](https://cdnjs.com/libraries/html2canvas)

# Third-party notices — NavRide GPX Editor

This directory implements NavRide’s GPX editor. Interaction methodology
(anchors, crop/split/merge, zoom-aware handles) is inspired by the
open-source project **gpx.studio**.

## gpx.studio / gpx library (MIT)

Repository: https://github.com/gpxstudio/gpx.studio  
License: MIT  
Copyright (c) 2026 gpx.studio

Adapted (not copied as a drop-in):

- Ramer–Douglas–Peucker + cross-arc distance (`geo.ts`)
- Zoom-for-distance mapping used to hide/show anchors (`anchors.ts`)
- Crop / reverse / round-trip / replace-span semantics (`ops.ts`)

Not copied:

- Branding, logos, names, UI chrome, copy
- GraphHopper / BRouter clients and private endpoints
- MapTiler keys, MapTiler/gpx.studio map styles
- POI category catalog of gpx.studio
- Heart-rate / cadence / power UI

The MIT license text of gpx.studio:

```
MIT License

Copyright (c) 2026 gpx.studio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

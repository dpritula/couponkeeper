<script setup lang="ts">
import { useId } from 'vue';

// Inlined from apps/mobile/icon-source/icon_full.svg — if that file is ever
// revised, update this markup to match by hand (see design.md's Risks).
// The gradient needs a per-instance id (via useId()) rather than a fixed
// string: this component is mounted three times at once (Ionic keeps every
// tab's page alive in the DOM), and duplicate SVG ids in the same document
// make `fill="url(#...)"` resolve unpredictably — a real bug seen while
// verifying this in the browser (the Settings tab's logo silently rendered
// with no fill at all).
const gradientId = useId();
</script>

<template>
  <!-- viewBox is cropped tighter than the source's own 0 0 108 108 (which
       reserves Android's adaptive-icon safe-zone padding around the glyph —
       necessary there since the OS can mask/crop the edges, irrelevant here
       since we render the whole square ourselves) so the glyph reads clearly
       at this component's small on-screen size. Measured precisely via
       getBoundingClientRect() in the browser rather than eyeballed: the
       glyph's rendered bounding box is ~[24.98,83.02]x[31.84,76.16], so
       "23 23 62 62" (centered on the same (54,54) the source rotates around)
       crops close to that box while staying square, so the background fills
       the container edge-to-edge with no letterboxing. -->
  <svg class="app-logo" viewBox="23 23 62 62" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="108" y2="108" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#5B8B6C" />
        <stop offset="1" stop-color="#3B6249" />
      </linearGradient>
    </defs>
    <rect width="108" height="108" :fill="`url(#${gradientId})`" />
    <g transform="translate(54 54) rotate(-10) scale(.94) translate(-54 -54)">
      <path
        fill="#F3EFE4"
        fill-rule="evenodd"
        d="M31,35 H77 A5,5 0 0 1 82,40 V49.5 A4.5,4.5 0 0 0 82,58.5 V68 A5,5 0 0 1 77,73 H31 A5,5 0 0 1 26,68 V58.5 A4.5,4.5 0 0 0 26,49.5 V40 A5,5 0 0 1 31,35 Z M62,39 h2 v3.6 h-2 Z M62,45.6 h2 v3.6 h-2 Z M62,52.2 h2 v3.6 h-2 Z M62,58.8 h2 v3.6 h-2 Z M62,65.4 h2 v3.6 h-2 Z M35.199999999999996,48.4 A4.2,4.2 0 1 0 43.6,48.4 A4.2,4.2 0 1 0 35.199999999999996,48.4 Z M37.6,48.4 A1.8,1.8 0 1 0 41.199999999999996,48.4 A1.8,1.8 0 1 0 37.6,48.4 Z M44.4,59.6 A4.2,4.2 0 1 0 52.800000000000004,59.6 A4.2,4.2 0 1 0 44.4,59.6 Z M46.800000000000004,59.6 A1.8,1.8 0 1 0 50.4,59.6 A1.8,1.8 0 1 0 46.800000000000004,59.6 Z M51.37,44.82 L48.63,43.18 L36.63,63.18 L39.37,64.82 Z"
      />
    </g>
  </svg>
</template>

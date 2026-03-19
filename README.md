# RB-TFT2.0 (micro:bit + ST7789 TFT 2.0")

## Features
- ST7789 SPI driver (Landscape 320x240)
- Pretty fonts:
  - 5x7 text
  - 7-seg instrument digits
- Graph blocks (education friendly):
  - 1 graph or 2 graphs
  - smoothing (EMA)
  - auto-scale reset
  - Y axis auto / fixed

## Quick Test
Open `test.ts` and download to micro:bit.

## Wiring (default)
- SCK: P13
- MOSI: P15
- DC: P14
- (CS tied to GND)
- VCC: 3V
- GND: GND

If the image is shifted, try `RBTFT20.setOffset(80,0)` or `RBTFT20.setOffset(0,80)`.
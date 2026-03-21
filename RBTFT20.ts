/**
 * RGB565 Color
 */
enum Color {
    Black = 0x0000,
    Navy = 0x000F,
    DarkGreen = 0x03E0,
    DarkCyan = 0x03EF,
    Maroon = 0x7800,
    Purple = 0x780F,
    Olive = 0x7BE0,
    LightGrey = 0xC618,
    DarkGrey = 0x7BEF,
    Blue = 0x001F,
    Green = 0x07E0,
    Cyan = 0x07FF,
    Red = 0xF800,
    Magenta = 0xF81F,
    Yellow = 0xFFE0,
    White = 0xFFFF
}

//% color=#1E90FF icon="\uf108" block="RB-TFT20" weight=80
namespace RBTFT20 {

    // Landscape(90°) logical coordinates
    const TFTWIDTH = 320
    const TFTHEIGHT = 240

    // Fixed pins (student version)
    const FIX_SCK: DigitalPin = DigitalPin.P13
    const FIX_MOSI: DigitalPin = DigitalPin.P15
    const FIX_DC: DigitalPin = DigitalPin.P14

    // internal
    let _xOffset = 0
    let _yOffset = 0
    let _inited = false

    enum TFTCommands {
        SWRESET = 0x01,
        SLPOUT = 0x11,
        INVOFF = 0x20,
        INVON = 0x21,
        DISPON = 0x29,
        CASET = 0x2A,
        RASET = 0x2B,
        RAMWR = 0x2C,
        MADCTL = 0x36,
        COLMOD = 0x3A
    }

    function hi(v: number): number { return (v >> 8) & 0xFF }
    function lo(v: number): number { return v & 0xFF }

    function send(cmd: number, params: number[]): void {
        pins.digitalWritePin(FIX_DC, 0)
        pins.spiWrite(cmd)
        if (params && params.length) {
            pins.digitalWritePin(FIX_DC, 1)
            for (let b of params) pins.spiWrite(b)
        }
    }

    function sendBuf(cmd: number, buf: Buffer): void {
        pins.digitalWritePin(FIX_DC, 0)
        let c = pins.createBuffer(1)
        c[0] = cmd
        pins.spiTransfer(c, null)
        if (buf && buf.length) {
            pins.digitalWritePin(FIX_DC, 1)
            pins.spiTransfer(buf, null)
        }
    }

    function beginPixels(): void {
        pins.digitalWritePin(FIX_DC, 0)
        pins.spiWrite(TFTCommands.RAMWR)
        pins.digitalWritePin(FIX_DC, 1)
    }

    function endPixels(): void {
        pins.digitalWritePin(FIX_DC, 0)
    }

    function setWindow(x0: number, y0: number, x1: number, y1: number): void {
        x0 += _xOffset; x1 += _xOffset
        y0 += _yOffset; y1 += _yOffset

        let buf = pins.createBuffer(4)

        // CASET
        buf[0] = hi(x0); buf[1] = lo(x0)
        buf[2] = hi(x1); buf[3] = lo(x1)
        sendBuf(TFTCommands.CASET, buf)

        // RASET
        buf[0] = hi(y0); buf[1] = lo(y0)
        buf[2] = hi(y1); buf[3] = lo(y1)
        sendBuf(TFTCommands.RASET, buf)

        // RAMWR
        sendBuf(TFTCommands.RAMWR, null)
    }

    /**
     * Initialize TFT Display (ST7789, SPI MODE3, Landscape 90°)
     * Pins are FIXED: SCK=P13, MOSI=P15, DC=P14
     */
    //% block="RBTFT20 초기화"
    //% weight=65
    export function initRBTFT20(): void {
        if (_inited) return

        // ===== FIXED PINS =====
        // Dummy MISO = P8 (avoid P1/P2 because students use analog pins)
        pins.spiPins(FIX_MOSI, DigitalPin.P8, FIX_SCK)
        pins.spiFormat(8, 3)          // MODE3
        pins.spiFrequency(8000000)    // 8MHz stable

        pins.digitalWritePin(FIX_DC, 1)

        // Basic init
        send(TFTCommands.SWRESET, [])
        basic.pause(150)

        send(TFTCommands.SLPOUT, [])
        basic.pause(120)

        // 16-bit color
        send(TFTCommands.COLMOD, [0x55])
        basic.pause(10)

        // Landscape 90°
        // 0x60 is commonly used for 90° rotation on ST7789
        send(TFTCommands.MADCTL, [0x60])

        // Inversion on
        send(TFTCommands.INVON, [])
        basic.pause(10)

        send(TFTCommands.DISPON, [])
        basic.pause(120)

        clearScreen()
        basic.pause(120)

        _inited = true
    }


    /**
     * (Optional) Some modules need display memory offsets.
     */
    //% block="Set display offset x %x y %y"
    //% weight=95
    export function setOffset(x: number, y: number): void {
        _xOffset = x
        _yOffset = y
    }

    /**
     * Clear screen (fill black)
     */
    //% block="Clear screen"
    //% weight=80
    export function clearScreen(): void {
        drawRectangle(0, 0, TFTWIDTH, TFTHEIGHT, Color.Black)
    }

    /**
     * Fill rectangle (fast line buffer)
     */
    //% block="Fill rect x %x y %y w %w h %h color %color"
    //% weight=75
    export function drawRectangle(x: number, y: number, w: number, h: number, color: Color): void {
        if (w <= 0 || h <= 0) return

        let x1 = x + w - 1
        let y1 = y + h - 1

        if (x < 0) x = 0
        if (y < 0) y = 0
        if (x1 >= TFTWIDTH) x1 = TFTWIDTH - 1
        if (y1 >= TFTHEIGHT) y1 = TFTHEIGHT - 1
        if (x > x1 || y > y1) return

        setWindow(x, y, x1, y1)

        const hiC = hi(color)
        const loC = lo(color)

        const width = (x1 - x + 1)
        const height = (y1 - y + 1)

        // line buffer (RAM saving + speed)
        let lineBuf = pins.createBuffer(width * 2)
        for (let i = 0; i < width; i++) {
            lineBuf[i * 2] = hiC
            lineBuf[i * 2 + 1] = loC
        }

        beginPixels()
        for (let row = 0; row < height; row++) {
            pins.spiTransfer(lineBuf, null)
        }
        endPixels()
    }

    /**
     * Draw pixel (simple, slower)
     */
    //% block="Draw pixel x %x y %y color %color"
    //% x.min=0 x.max=319
    //% y.min=0 y.max=239
    //% weight=70
    export function drawPixel(x: number, y: number, color: Color): void {
        if (x < 0 || x >= TFTWIDTH || y < 0 || y >= TFTHEIGHT) return
        setWindow(x, y, x, y)
        beginPixels()
        pins.spiWrite(hi(color))
        pins.spiWrite(lo(color))
        endPixels()
    }


    //% block="TFT width"
    //% weight=60
    export function width(): number { return TFTWIDTH }

    //% block="TFT height"
    //% weight=59
    export function height(): number { return TFTHEIGHT }


 
}
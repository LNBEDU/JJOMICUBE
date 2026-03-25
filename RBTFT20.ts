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

//% color=#1E90FF icon="\uf108" block="TFT 화면" weight=80
namespace RBTFT20 {

    // 가로형(90도) 기준 논리 좌표
    const TFTWIDTH = 320
    const TFTHEIGHT = 240

    // 고정 핀
    const FIX_SCK: DigitalPin = DigitalPin.P13
    const FIX_MOSI: DigitalPin = DigitalPin.P15
    const FIX_DC: DigitalPin = DigitalPin.P14

    // 내부 변수
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

    function hi(v: number): number {
        return (v >> 8) & 0xFF
    }

    function lo(v: number): number {
        return v & 0xFF
    }

    function send(cmd: number, params: number[]): void {
        pins.digitalWritePin(FIX_DC, 0)
        pins.spiWrite(cmd)

        if (params && params.length) {
            pins.digitalWritePin(FIX_DC, 1)
            for (let b of params) {
                pins.spiWrite(b)
            }
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
        x0 += _xOffset
        x1 += _xOffset
        y0 += _yOffset
        y1 += _yOffset

        let buf = pins.createBuffer(4)

        // CASET
        buf[0] = hi(x0)
        buf[1] = lo(x0)
        buf[2] = hi(x1)
        buf[3] = lo(x1)
        sendBuf(TFTCommands.CASET, buf)

        // RASET
        buf[0] = hi(y0)
        buf[1] = lo(y0)
        buf[2] = hi(y1)
        buf[3] = lo(y1)
        sendBuf(TFTCommands.RASET, buf)

        // RAMWR
        sendBuf(TFTCommands.RAMWR, null)
    }

    function clamp255(v: number): number {
        if (v < 0) return 0
        if (v > 255) return 255
        return Math.round(v)
    }

    function min3(a: number, b: number, c: number): number {
        return Math.min(a, Math.min(b, c))
    }

    function max3(a: number, b: number, c: number): number {
        return Math.max(a, Math.max(b, c))
    }

    /**
     * TFT 초기화
     * ST7789, SPI MODE3, 가로형 90도
     * 핀 고정: SCK=P13, MOSI=P15, DC=P14
     */
    //% block="TFT 초기화"
    //% weight=100
    export function init(): void {
        if (_inited) return

        // MISO는 사용 안 하므로 더미 핀 사용
        pins.spiPins(FIX_MOSI, DigitalPin.P8, FIX_SCK)
        pins.spiFormat(8, 3)
        pins.spiFrequency(8000000)

        pins.digitalWritePin(FIX_DC, 1)

        send(TFTCommands.SWRESET, [])
        basic.pause(150)

        send(TFTCommands.SLPOUT, [])
        basic.pause(120)

        // 16비트 색상
        send(TFTCommands.COLMOD, [0x55])
        basic.pause(10)

        // 가로형 90도
        send(TFTCommands.MADCTL, [0x60])

        // 반전 ON
        send(TFTCommands.INVON, [])
        basic.pause(10)

        send(TFTCommands.DISPON, [])
        basic.pause(120)

        _inited = true
    }

    /**
     * 디스플레이 오프셋 설정
     */
    export function setOffset(x: number, y: number): void {
        _xOffset = x
        _yOffset = y
    }

    /**
     * RGB(0~255)를 TFT용 RGB565 색상값으로 변환
     */
    //% block="색상 만들기 R %r G %g B %b"
    //% r.min=0 r.max=255
    //% g.min=0 g.max=255
    //% b.min=0 b.max=255
    //% weight=94
    export function rgb(r: number, g: number, b: number): number {
        r = clamp255(r)
        g = clamp255(g)
        b = clamp255(b)

        let r5 = (r & 0xF8) << 8
        let g6 = (g & 0xFC) << 3
        let b5 = (b >> 3)

        return r5 | g6 | b5
    }

    /**
     * 기본 색상 반환
     */
    //% block="기본색 검정"
    //% weight=93
    export function black(): number {
        return Color.Black
    }

    //% block="기본색 흰색"
    //% weight=92
    export function white(): number {
        return Color.White
    }

    //% block="기본색 빨강"
    //% weight=91
    export function red(): number {
        return Color.Red
    }

    //% block="기본색 초록"
    //% weight=90
    export function green(): number {
        return Color.Green
    }

    //% block="기본색 파랑"
    //% weight=89
    export function blue(): number {
        return Color.Blue
    }

    //% block="기본색 노랑"
    //% weight=88
    export function yellow(): number {
        return Color.Yellow
    }

    //% block="기본색 청록"
    //% weight=87
    export function cyan(): number {
        return Color.Cyan
    }

    //% block="기본색 자홍"
    //% weight=86
    export function magenta(): number {
        return Color.Magenta
    }

    //% block="기본색 남색"
    //% weight=85
    export function navy(): number {
        return Color.Navy
    }

    /**
     * 화면 전체 지우기
     */
    //% block="화면 지우기"
    //% weight=84
    export function clearScreen(): void {
        drawRectangle(0, 0, TFTWIDTH, TFTHEIGHT, Color.Black)
    }

    /**
     * 지정한 색으로 화면 전체 채우기
     */
    //% block="화면을 색 %color 로 채우기"
    //% weight=83
    export function clearScreenColor(color: number): void {
        drawRectangle(0, 0, TFTWIDTH, TFTHEIGHT, color)
    }

    /**
     * 사각형 채우기
     */
    //% block="사각형 채우기 x %x y %y 너비 %w 높이 %h 색 %color"
    //% weight=82
    export function drawRectangle(x: number, y: number, w: number, h: number, color: number): void {
        init()
        if (w <= 0 || h <= 0) return

        let x1 = x + w - 1
        let y1 = y + h - 1

        if (x < 0) x = 0
        if (y < 0) y = 0
        if (x1 >= TFTWIDTH) x1 = TFTWIDTH - 1
        if (y1 >= TFTHEIGHT) y1 = TFTHEIGHT - 1
        if (x > x1 || y > y1) return

        setWindow(x, y, x1, y1)

        let hiC = hi(color)
        let loC = lo(color)

        let width = x1 - x + 1
        let height = y1 - y + 1

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
     * 픽셀 그리기
     */
    //% block="픽셀 그리기 x %x y %y 색 %color"
    //% x.min=0 x.max=319
    //% y.min=0 y.max=239
    //% weight=81
    export function drawPixel(x: number, y: number, color: number): void {
        init()

        if (x < 0 || x >= TFTWIDTH || y < 0 || y >= TFTHEIGHT) return

        setWindow(x, y, x, y)
        beginPixels()
        pins.spiWrite(hi(color))
        pins.spiWrite(lo(color))
        endPixels()
    }

    /**
     * 선 그리기
     */
    //% block="선 그리기 x1 %x0 y1 %y0 x2 %x1 y2 %y1 색 %color"
    //% weight=80
    export function drawLine(x0: number, y0: number, x1: number, y1: number, color: number): void {
        init()

        let dx = Math.abs(x1 - x0)
        let sx = x0 < x1 ? 1 : -1
        let dy = -Math.abs(y1 - y0)
        let sy = y0 < y1 ? 1 : -1
        let err = dx + dy

        while (true) {
            drawPixel(x0, y0, color)

            if (x0 == x1 && y0 == y1) break

            let e2 = 2 * err

            if (e2 >= dy) {
                err += dy
                x0 += sx
            }

            if (e2 <= dx) {
                err += dx
                y0 += sy
            }
        }
    }

    /**
     * 원 그리기
     */
    //% block="원 그리기 중심 x %cx y %cy 반지름 %r 색 %color"
    //% weight=79
    export function drawCircle(cx: number, cy: number, r: number, color: number): void {
        init()
        if (r <= 0) return

        let x = r
        let y = 0
        let err = 0

        while (x >= y) {
            drawPixel(cx + x, cy + y, color)
            drawPixel(cx + y, cy + x, color)
            drawPixel(cx - y, cy + x, color)
            drawPixel(cx - x, cy + y, color)
            drawPixel(cx - x, cy - y, color)
            drawPixel(cx - y, cy - x, color)
            drawPixel(cx + y, cy - x, color)
            drawPixel(cx + x, cy - y, color)

            y += 1

            if (err <= 0) {
                err += 2 * y + 1
            } else {
                x -= 1
                err += 2 * (y - x) + 1
            }
        }
    }

    /**
     * 채운 원 그리기
     */
    //% block="채운 원 그리기 중심 x %cx y %cy 반지름 %r 색 %color"
    //% weight=78
    export function fillCircle(cx: number, cy: number, r: number, color: number): void {
        init()
        if (r <= 0) return

        for (let y = -r; y <= r; y++) {
            for (let x = -r; x <= r; x++) {
                if (x * x + y * y <= r * r) {
                    drawPixel(cx + x, cy + y, color)
                }
            }
        }
    }

    /**
     * 삼각형 그리기
     */
    //% block="삼각형 그리기 x1 %x1 y1 %y1 x2 %x2 y2 %y2 x3 %x3 y3 %y3 색 %color"
    //% weight=77
    export function drawTriangle(
        x1: number, y1: number,
        x2: number, y2: number,
        x3: number, y3: number,
        color: number
    ): void {
        drawLine(x1, y1, x2, y2, color)
        drawLine(x2, y2, x3, y3, color)
        drawLine(x3, y3, x1, y1, color)
    }

    /**
     * 채운 삼각형 그리기
     */
    //% block="채운 삼각형 x1 %x1 y1 %y1 x2 %x2 y2 %y2 x3 %x3 y3 %y3 색 %color"
    //% weight=76
    export function fillTriangle(
        x1: number, y1: number,
        x2: number, y2: number,
        x3: number, y3: number,
        color: number
    ): void {
        let minX = min3(x1, x2, x3)
        let maxX = max3(x1, x2, x3)
        let minY = min3(y1, y2, y3)
        let maxY = max3(y1, y2, y3)

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                let a = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)
                let b = (x3 - x2) * (y - y2) - (y3 - y2) * (x - x2)
                let c = (x1 - x3) * (y - y3) - (y1 - y3) * (x - x3)

                if ((a >= 0 && b >= 0 && c >= 0) || (a <= 0 && b <= 0 && c <= 0)) {
                    drawPixel(x, y, color)
                }
            }
        }
    }

    /**
     * 별 그리기
     */
    //% block="별 그리기 중심 x %cx y %cy 크기 %r 색 %color"
    //% weight=75
    export function drawStar(cx: number, cy: number, r: number, color: number): void {
        init()
        if (r <= 0) return

        let px: number[] = []
        let py: number[] = []

        for (let i = 0; i < 5; i++) {
            let angle = -90 + i * 72
            let rad = angle * Math.PI / 180
            px.push(cx + Math.round(r * Math.cos(rad)))
            py.push(cy + Math.round(r * Math.sin(rad)))
        }

        drawLine(px[0], py[0], px[2], py[2], color)
        drawLine(px[2], py[2], px[4], py[4], color)
        drawLine(px[4], py[4], px[1], py[1], color)
        drawLine(px[1], py[1], px[3], py[3], color)
        drawLine(px[3], py[3], px[0], py[0], color)
    }

    /**
     * TFT 가로 크기
     */
    //% block="TFT 가로 크기"
    //% weight=60
    export function width(): number {
        return TFTWIDTH
    }

    /**
     * TFT 세로 크기
     */
    //% block="TFT 세로 크기"
    //% weight=59
    export function height(): number {
        return TFTHEIGHT
    }
}
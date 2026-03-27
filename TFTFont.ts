//% color=#00C2FF icon="\uf031" block="TFT 글꼴" weight=60
namespace TFTFont {

    // ==============================
    // 상태 아이콘 색상
    // ==============================
    let iconOnColor: number = Color.DarkGreen
    let iconOffColor: number = Color.DarkGrey
    let iconBgColor: number = Color.Black

    /**
     * 상태 아이콘 색상 설정
     */
    //% block="상태 아이콘 색상 설정 켜짐 %onColor 꺼짐 %offColor 배경 %bgColor"
    //% weight=70
    export function setStatusIconColors(onColor: number, offColor: number, bgColor: number): void {
        iconOnColor = onColor
        iconOffColor = offColor
        iconBgColor = bgColor
    }

    /**
     * 정수 나눗셈
     */
    function idiv(a: number, b: number): number {
        return (a / b) >> 0
    }

    /**
     * 선 그리기
     */
    function line(x0: number, y0: number, x1: number, y1: number, color: number): void {
        let dx = Math.abs(x1 - x0)
        let sx = x0 < x1 ? 1 : -1
        let dy = -Math.abs(y1 - y0)
        let sy = y0 < y1 ? 1 : -1
        let err = dx + dy

        while (true) {
            TFT20.drawPixel(x0, y0, color)
            if (x0 == x1 && y0 == y1) break
            let e2 = err << 1
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
     * 와이파이/블루투스 상태 아이콘 표시
     */
    export function drawStatusIcons(): void {
        TFT20.drawRectangle(268, 0, 50, TFTGraph.STATUS_H - 3, iconBgColor)

        if (ESP32UART.wifiConnected == true) {
            drawWifiIcon(272, 0, iconOnColor)
        } else {
            drawWifiIcon(272, 0, iconOffColor)
        }

        if (ESP32UART.btConnected == true) {
            drawBluetoothIcon(298, 0, iconOnColor)
        } else {
            drawBluetoothIcon(298, 0, iconOffColor)
        }
    }

    /**
     * 와이파이 아이콘
     */
    function drawWifiIcon(x: number, y: number, color: number): void {
        TFT20.drawRectangle(x + 7, y + 11, 2, 2, color)

        TFT20.drawPixel(x + 5, y + 9, color)
        TFT20.drawPixel(x + 6, y + 8, color)
        TFT20.drawPixel(x + 7, y + 8, color)
        TFT20.drawPixel(x + 8, y + 8, color)
        TFT20.drawPixel(x + 9, y + 9, color)

        TFT20.drawPixel(x + 3, y + 7, color)
        TFT20.drawPixel(x + 4, y + 6, color)
        TFT20.drawPixel(x + 5, y + 5, color)
        TFT20.drawPixel(x + 6, y + 5, color)
        TFT20.drawPixel(x + 7, y + 5, color)
        TFT20.drawPixel(x + 8, y + 5, color)
        TFT20.drawPixel(x + 9, y + 5, color)
        TFT20.drawPixel(x + 10, y + 6, color)
        TFT20.drawPixel(x + 11, y + 7, color)

        TFT20.drawPixel(x + 1, y + 5, color)
        TFT20.drawPixel(x + 2, y + 4, color)
        TFT20.drawPixel(x + 3, y + 3, color)
        TFT20.drawPixel(x + 4, y + 2, color)
        TFT20.drawPixel(x + 5, y + 2, color)
        TFT20.drawPixel(x + 6, y + 1, color)
        TFT20.drawPixel(x + 7, y + 1, color)
        TFT20.drawPixel(x + 8, y + 1, color)
        TFT20.drawPixel(x + 9, y + 2, color)
        TFT20.drawPixel(x + 10, y + 2, color)
        TFT20.drawPixel(x + 11, y + 3, color)
        TFT20.drawPixel(x + 12, y + 4, color)
        TFT20.drawPixel(x + 13, y + 5, color)
    }

    /**
     * 블루투스 아이콘
     */
    function drawBluetoothIcon(x: number, y: number, color: number): void {
        line(x + 5, y + 1, x + 5, y + 13, color)

        line(x + 5, y + 1, x + 10, y + 5, color)
        line(x + 10, y + 5, x + 5, y + 7, color)

        line(x + 5, y + 7, x + 10, y + 10, color)
        line(x + 10, y + 10, x + 5, y + 13, color)

        line(x + 5, y + 7, x + 2, y + 4, color)
        line(x + 5, y + 7, x + 2, y + 10, color)
    }

    function colBitsOf(ch: number, col: number): number {
        if (ch >= 48 && ch <= 57) {
            const idx = ch - 48
            return DIGITS_5x7[idx * 5 + col]
        }
        if (ch >= 65 && ch <= 90) {
            const idx = ch - 65
            return ALPHA_5x7[idx * 5 + col]
        }
        if (ch >= 97 && ch <= 122) {
            const idx = ch - 97
            return ALPHA_LOWER_5x7[idx * 5 + col]
        }

        if (ch == 32) return 0x00
        if (ch == 58) return COLON_5x7[col]
        if (ch == 45) return DASH_5x7[col]
        if (ch == 46) return DOT_5x7[col]
        if (ch == 47) return SLASH_5x7[col]
        if (ch == 91) return BRACKET_L_5x7[col]
        if (ch == 93) return BRACKET_R_5x7[col]
        if (ch == 60) return LESS_5x7[col]
        if (ch == 62) return GREATER_5x7[col]
        if (ch == 61) return EQUAL_5x7[col]
        if (ch == 33) return EXCLAMATION_5x7[col]
        if (ch == 63) return QUESTION_5x7[col]
        if (ch == 43) return PLUS_5x7[col]
        if (ch == 37) return PERCENT_5x7[col]
        if (ch == 40) return PAREN_L_5x7[col]
        if (ch == 41) return PAREN_R_5x7[col]
        if (ch == 44) return COMMA_5x7[col]
        if (ch == 59) return SEMICOLON_5x7[col]
        if (ch == 95) return UNDERSCORE_5x7[col]
        return 0x00
    }

    const DIGITS_5x7: number[] = [
        0x3E, 0x51, 0x49, 0x45, 0x3E,
        0x00, 0x42, 0x7F, 0x40, 0x00,
        0x42, 0x61, 0x51, 0x49, 0x46,
        0x21, 0x41, 0x45, 0x4B, 0x31,
        0x18, 0x14, 0x12, 0x7F, 0x10,
        0x27, 0x45, 0x45, 0x45, 0x39,
        0x3C, 0x4A, 0x49, 0x49, 0x30,
        0x01, 0x71, 0x09, 0x05, 0x03,
        0x36, 0x49, 0x49, 0x49, 0x36,
        0x06, 0x49, 0x49, 0x29, 0x1E
    ]

    const ALPHA_5x7: number[] = [
        0x7E, 0x11, 0x11, 0x11, 0x7E,
        0x7F, 0x49, 0x49, 0x49, 0x36,
        0x3E, 0x41, 0x41, 0x41, 0x22,
        0x7F, 0x41, 0x41, 0x22, 0x1C,
        0x7F, 0x49, 0x49, 0x49, 0x41,
        0x7F, 0x09, 0x09, 0x09, 0x01,
        0x3E, 0x41, 0x49, 0x49, 0x7A,
        0x7F, 0x08, 0x08, 0x08, 0x7F,
        0x00, 0x41, 0x7F, 0x41, 0x00,
        0x20, 0x40, 0x41, 0x3F, 0x01,
        0x7F, 0x08, 0x14, 0x22, 0x41,
        0x7F, 0x40, 0x40, 0x40, 0x40,
        0x7F, 0x02, 0x0C, 0x02, 0x7F,
        0x7F, 0x04, 0x08, 0x10, 0x7F,
        0x3E, 0x41, 0x41, 0x41, 0x3E,
        0x7F, 0x09, 0x09, 0x09, 0x06,
        0x3E, 0x41, 0x51, 0x21, 0x5E,
        0x7F, 0x09, 0x19, 0x29, 0x46,
        0x46, 0x49, 0x49, 0x49, 0x31,
        0x01, 0x01, 0x7F, 0x01, 0x01,
        0x3F, 0x40, 0x40, 0x40, 0x3F,
        0x1F, 0x20, 0x40, 0x20, 0x1F,
        0x7F, 0x20, 0x18, 0x20, 0x7F,
        0x63, 0x14, 0x08, 0x14, 0x63,
        0x07, 0x08, 0x70, 0x08, 0x07,
        0x61, 0x51, 0x49, 0x45, 0x43
    ]

    const ALPHA_LOWER_5x7: number[] = [
        0x20, 0x54, 0x54, 0x54, 0x78,
        0x7F, 0x48, 0x44, 0x44, 0x38,
        0x38, 0x44, 0x44, 0x44, 0x20,
        0x38, 0x44, 0x44, 0x48, 0x7F,
        0x38, 0x54, 0x54, 0x54, 0x18,
        0x08, 0x7E, 0x09, 0x01, 0x02,
        0x0C, 0x52, 0x52, 0x52, 0x3E,
        0x7F, 0x08, 0x04, 0x04, 0x78,
        0x00, 0x44, 0x7D, 0x40, 0x00,
        0x20, 0x40, 0x44, 0x3D, 0x00,
        0x7F, 0x10, 0x28, 0x44, 0x00,
        0x00, 0x41, 0x7F, 0x40, 0x00,
        0x7C, 0x04, 0x18, 0x04, 0x78,
        0x7C, 0x08, 0x04, 0x04, 0x78,
        0x38, 0x44, 0x44, 0x44, 0x38,
        0x7C, 0x14, 0x14, 0x14, 0x08,
        0x08, 0x14, 0x14, 0x18, 0x7C,
        0x7C, 0x08, 0x04, 0x04, 0x08,
        0x48, 0x54, 0x54, 0x54, 0x20,
        0x04, 0x3F, 0x44, 0x40, 0x20,
        0x3C, 0x40, 0x40, 0x20, 0x7C,
        0x1C, 0x20, 0x40, 0x20, 0x1C,
        0x3C, 0x40, 0x30, 0x40, 0x3C,
        0x44, 0x28, 0x10, 0x28, 0x44,
        0x0C, 0x50, 0x50, 0x50, 0x3C,
        0x44, 0x64, 0x54, 0x4C, 0x44
    ]

    const COLON_5x7: number[] = [0x00, 0x36, 0x36, 0x00, 0x00]
    const DASH_5x7: number[] = [0x08, 0x08, 0x08, 0x08, 0x08]
    const DOT_5x7: number[] = [0x00, 0x60, 0x60, 0x00, 0x00]
    const SLASH_5x7: number[] = [0x20, 0x10, 0x08, 0x04, 0x02]
    const BRACKET_L_5x7: number[] = [0x00, 0x7F, 0x41, 0x41, 0x00]
    const BRACKET_R_5x7: number[] = [0x00, 0x41, 0x41, 0x7F, 0x00]
    const LESS_5x7: number[] = [0x08, 0x14, 0x22, 0x41, 0x00]
    const GREATER_5x7: number[] = [0x41, 0x22, 0x14, 0x08, 0x00]
    const EQUAL_5x7: number[] = [0x14, 0x14, 0x14, 0x14, 0x14]
    const EXCLAMATION_5x7: number[] = [0x00, 0x00, 0x5F, 0x00, 0x00]
    const QUESTION_5x7: number[] = [0x02, 0x01, 0x51, 0x09, 0x06]
    const PLUS_5x7: number[] = [0x08, 0x08, 0x3E, 0x08, 0x08]
    const PERCENT_5x7: number[] = [0x23, 0x13, 0x08, 0x64, 0x62]
    const PAREN_L_5x7: number[] = [0x00, 0x1C, 0x22, 0x41, 0x00]
    const PAREN_R_5x7: number[] = [0x00, 0x41, 0x22, 0x1C, 0x00]
    const COMMA_5x7: number[] = [0x00, 0x40, 0x30, 0x00, 0x00]
    const SEMICOLON_5x7: number[] = [0x00, 0x36, 0x56, 0x00, 0x00]
    const UNDERSCORE_5x7: number[] = [0x40, 0x40, 0x40, 0x40, 0x40]

    /**
     * 5x7 텍스트 출력
     */
    //% block="텍스트 출력 x %x y %y 글자 %text 크기 %scale 글자색 %color 배경색 %bg"
    //% scale.min=1 scale.max=4 scale.defl=2
    //% weight=50
    export function drawText5x7(x: number, y: number, text: string, scale: number, color: number, bg: number): void {
        if (!text) return
        if (scale < 1) scale = 1

        let cursorX = x

        for (let i = 0; i < text.length; i++) {
            const ch = text.charCodeAt(i)
            const w = 6 * scale
            const h = 7 * scale

            TFT20.drawRectangle(cursorX, y, w, h, bg)

            for (let col = 0; col < 5; col++) {
                const bits = colBitsOf(ch, col)
                for (let row = 0; row < 7; row++) {
                    if (bits & (1 << row)) {
                        TFT20.drawRectangle(
                            cursorX + col * scale,
                            y + row * scale,
                            scale,
                            scale,
                            color
                        )
                    }
                }
            }

            cursorX += 6 * scale
        }

        drawStatusIcons()
    }

    /**
     * 5x7 숫자 출력
     */
    //% block="숫자 출력 x %x y %y 값 %value 자릿수 %digits 크기 %scale 글자색 %color 배경색 %bg"
    //% digits.min=1 digits.max=6 digits.defl=4
    //% scale.min=1 scale.max=4 scale.defl=2
    //% weight=49
    export function drawNumber5x7(x: number, y: number, value: number, digits: number, scale: number, color: number, bg: number): void {
        if (value < 0) value = 0
        if (value > 999999) value = 999999

        let s = "" + Math.round(value)
        while (s.length < digits) s = " " + s
        if (s.length > digits) s = s.substr(s.length - digits)

        drawText5x7(x, y, s, scale, color, bg)
    }

    function segMask(d: number): number {
        const masks = [
            0b0111111,
            0b0000110,
            0b1011011,
            0b1001111,
            0b1100110,
            0b1101101,
            0b1111101,
            0b0000111,
            0b1111111,
            0b1101111
        ]
        return masks[d]
    }

    function drawSegDigit(x: number, y: number, d: number, w: number, h: number, t: number, color: number, bg: number): void {
        TFT20.drawRectangle(x, y, w, h, bg)
        if (d < 0 || d > 9) return

        const m = segMask(d)

        const left = x
        const top = y
        const right = x + w
        const bottom = y + h
        const mid = y + idiv(h, 2)

        const hLen = w - 2 * t
        const vLen = idiv(h - 3 * t, 2)

        if (m & (1 << 0)) TFT20.drawRectangle(left + t, top, hLen, t, color)
        if (m & (1 << 1)) TFT20.drawRectangle(right - t, top + t, t, vLen, color)
        if (m & (1 << 2)) TFT20.drawRectangle(right - t, mid + t, t, vLen, color)
        if (m & (1 << 3)) TFT20.drawRectangle(left + t, bottom - t, hLen, t, color)
        if (m & (1 << 4)) TFT20.drawRectangle(left, mid + t, t, vLen, color)
        if (m & (1 << 5)) TFT20.drawRectangle(left, top + t, t, vLen, color)
        if (m & (1 << 6)) TFT20.drawRectangle(left + t, mid, hLen, t, color)
    }

    /**
     * 7세그 숫자 출력
     */
    //% block="7세그 숫자 출력 x %x y %y 값 %value 자릿수 %digits 숫자너비 %w 숫자높이 %h 두께 %t 글자색 %color 배경색 %bg"
    //% digits.min=1 digits.max=6 digits.defl=3
    //% w.min=10 w.max=80 w.defl=22
    //% h.min=16 h.max=120 h.defl=40
    //% t.min=1 t.max=12 t.defl=4
    //% weight=48
    export function drawNumber7Seg(x: number, y: number, value: number, digits: number, w: number, h: number, t: number, color: number, bg: number): void {
        if (value < 0) value = 0
        if (value > 999999) value = 999999

        let s = "" + Math.round(value)
        while (s.length < digits) s = " " + s
        if (s.length > digits) s = s.substr(s.length - digits)

        let cursorX = x
        const spacing = Math.max(2, idiv(w, 6))

        for (let i = 0; i < s.length; i++) {
            const ch = s.charAt(i)

            if (ch == " ") {
                TFT20.drawRectangle(cursorX, y, w, h, bg)
            } else {
                drawSegDigit(cursorX, y, ch.charCodeAt(0) - 48, w, h, t, color, bg)
            }

            cursorX += w + spacing
        }

        drawStatusIcons()
    }
}
/**
 * JJOMICUBE ADS1115 Blocks
 * ADS1115 16-bit ADC for micro:bit
 */

//% color="#2f74ff" icon="\uf0e7" block="JJOADS1115" weight=60
namespace JJOADS1115 {

    let adsAddress = 0x48

    // PGA full-scale range values
    const ADS1115_PGA_6_144V = 0x0000
    const ADS1115_PGA_4_096V = 0x0200
    const ADS1115_PGA_2_048V = 0x0400
    const ADS1115_PGA_1_024V = 0x0600
    const ADS1115_PGA_0_512V = 0x0800
    const ADS1115_PGA_0_256V = 0x0A00

    // Data rate
    const ADS1115_DR_128SPS = 0x0080

    // Mode
    const ADS1115_MODE_SINGLE = 0x0100

    // Comparator disable
    const ADS1115_COMP_DISABLE = 0x0003

    // OS bit
    const ADS1115_OS_SINGLE = 0x8000

    let gainBits = ADS1115_PGA_4_096V
    let fsMillivolts = 4096

    export enum ADS1115Channel {
        //% block="A0"
        A0 = 0,
        //% block="A1"
        A1 = 1,
        //% block="A2"
        A2 = 2,
        //% block="A3"
        A3 = 3
    }

    export enum ADS1115Gain {
        //% block="±6.144V"
        FS6144 = 0,
        //% block="±4.096V"
        FS4096 = 1,
        //% block="±2.048V"
        FS2048 = 2,
        //% block="±1.024V"
        FS1024 = 3,
        //% block="±0.512V"
        FS0512 = 4,
        //% block="±0.256V"
        FS0256 = 5
    }

    export enum ADS1115Diff {
        //% block="A0 - A1"
        A0_A1 = 0,
        //% block="A0 - A3"
        A0_A3 = 1,
        //% block="A1 - A3"
        A1_A3 = 2,
        //% block="A2 - A3"
        A2_A3 = 3
    }

    function writeRegister(reg: number, value: number): void {
        let buf = pins.createBuffer(3)
        buf[0] = reg
        buf[1] = (value >> 8) & 0xFF
        buf[2] = value & 0xFF
        pins.i2cWriteBuffer(adsAddress, buf, false)
    }

    function readRegister(reg: number): number {
        pins.i2cWriteNumber(adsAddress, reg, NumberFormat.UInt8BE, false)
        let buf = pins.i2cReadBuffer(adsAddress, 2, false)
        return (buf[0] << 8) | buf[1]
    }

    function toSigned16(v: number): number {
        if (v > 0x7FFF) {
            return v - 0x10000
        }
        return v
    }

    function muxForSingle(channel: ADS1115Channel): number {
        switch (channel) {
            case ADS1115Channel.A0: return 0x4000
            case ADS1115Channel.A1: return 0x5000
            case ADS1115Channel.A2: return 0x6000
            case ADS1115Channel.A3: return 0x7000
            default: return 0x4000
        }
    }

    function muxForDiff(diff: ADS1115Diff): number {
        switch (diff) {
            case ADS1115Diff.A0_A1: return 0x0000
            case ADS1115Diff.A0_A3: return 0x1000
            case ADS1115Diff.A1_A3: return 0x2000
            case ADS1115Diff.A2_A3: return 0x3000
            default: return 0x0000
        }
    }

    function readConversion(configMux: number): number {
        let config =
            ADS1115_OS_SINGLE |
            configMux |
            gainBits |
            ADS1115_MODE_SINGLE |
            ADS1115_DR_128SPS |
            ADS1115_COMP_DISABLE

        writeRegister(0x01, config)
        basic.pause(10)

        let raw = readRegister(0x00)
        return toSigned16(raw)
    }

    function rawToMillivolts(raw: number): number {
        return Math.idiv(raw * fsMillivolts, 32768)
    }

    /**
     * Initialize ADS1115
     */
    //% blockId=jjo_ads1115_init
    //% block="ADS1115 시작 주소 $addr gain $gain"
    //% addr.defl=72
    //% weight=100
    export function init(addr: number, gain: ADS1115Gain): void {
        adsAddress = addr & 0x7F
        setGain(gain)
    }

    /**
     * Set gain range
     */
    //% blockId=jjo_ads1115_set_gain
    //% block="ADS1115 gain $gain"
    //% weight=95
    export function setGain(gain: ADS1115Gain): void {
        switch (gain) {
            case ADS1115Gain.FS6144:
                gainBits = ADS1115_PGA_6_144V
                fsMillivolts = 6144
                break
            case ADS1115Gain.FS4096:
                gainBits = ADS1115_PGA_4_096V
                fsMillivolts = 4096
                break
            case ADS1115Gain.FS2048:
                gainBits = ADS1115_PGA_2_048V
                fsMillivolts = 2048
                break
            case ADS1115Gain.FS1024:
                gainBits = ADS1115_PGA_1_024V
                fsMillivolts = 1024
                break
            case ADS1115Gain.FS0512:
                gainBits = ADS1115_PGA_0_512V
                fsMillivolts = 512
                break
            case ADS1115Gain.FS0256:
                gainBits = ADS1115_PGA_0_256V
                fsMillivolts = 256
                break
        }
    }

    /**
     * Read raw ADC from single-ended channel
     */
    //% blockId=jjo_ads1115_read_raw
    //% block="ADS1115 $channel raw 읽기"
    //% weight=90
    export function readRaw(channel: ADS1115Channel): number {
        return readConversion(muxForSingle(channel))
    }

    /**
     * Read millivolts from single-ended channel
     */
    //% blockId=jjo_ads1115_read_mv
    //% block="ADS1115 $channel 전압 mV 읽기"
    //% weight=89
    export function readMilliVolts(channel: ADS1115Channel): number {
        let raw = readConversion(muxForSingle(channel))
        return rawToMillivolts(raw)
    }

    /**
     * Read volts from single-ended channel
     */
    //% blockId=jjo_ads1115_read_v
    //% block="ADS1115 $channel 전압 V 읽기"
    //% weight=88
    export function readVolts(channel: ADS1115Channel): number {
        let mv = readMilliVolts(channel)
        return mv / 1000
    }

    /**
     * Read raw ADC from differential input
     */
    //% blockId=jjo_ads1115_read_diff_raw
    //% block="ADS1115 차동 $diff raw 읽기"
    //% weight=85
    export function readDiffRaw(diff: ADS1115Diff): number {
        return readConversion(muxForDiff(diff))
    }

    /**
     * Read differential millivolts
     */
    //% blockId=jjo_ads1115_read_diff_mv
    //% block="ADS1115 차동 $diff 전압 mV 읽기"
    //% weight=84
    export function readDiffMilliVolts(diff: ADS1115Diff): number {
        let raw = readConversion(muxForDiff(diff))
        return rawToMillivolts(raw)
    }

    /**
     * Read comparator register for connection check
     */
    //% blockId=jjo_ads1115_is_connected
    //% block="ADS1115 연결 확인"
    //% weight=80
    export function isConnected(): boolean {
        let v = readRegister(0x01)
        return v >= 0
    }
}
/**
 * JJOMICUBE 통합 에듀 패키지
 * LCD(ST7789) + NeoPixel(Ring 12) 제어 전용
 */
//% color="#4c6ef5" icon="\uf1b2" block="JJOMICUBE" weight=110
namespace JJOMICUBE {
    
    /**
     * LCD와 네오픽셀을 한 번에 초기화합니다.
     */
    //% block="쪼미큐브 시작"
    //% weight=100
    export function start(): void {
        // 1. LCD 초기화 (TFTGraph 내부 layoutCommon 호출)
        // TFTGraph 패키지 내부에 layoutCommon을 export로 수정하거나 
        // 여기서 직접 초기화 로직을 수행합니다.
        
        RBTFT20.init()
        RBTFT20.clearScreen()
        basic.pause(500);
        
        // 2. 네오픽셀 초기화
        JJONeo.init(12, 40);
        
        // 3. 시작 알림 (LCD & LED 시너지)
        JJONeo.rainbow();
        basic.pause(500);
        JJONeo.clear();
        basic.pause(500);

        TFTGraph.drawStatus("System Ready", Color.Green);

        // 4. ESP32 UART 초기화
        //ESP32UART.initEsp32();
        //basic.pause(500);
    }

    /**
     * 기기의 상태를 LCD와 LED로 동시에 알립니다.
     * @param msg 상태 메시지
     * @param color 표시 색상
     */
    //% block="메시지 $msg 색상 $color"
    //% weight=90
    export function notify(msg: string, color: Color): void {
        // LCD 상단 상태창 업데이트
        TFTGraph.drawStatus(msg, color);
        
        // LED를 해당 색상으로 잠시 반짝임 (사용자 피드백)
        // Color enum과 NeoPixel의 RGB 매핑 로직이 필요할 수 있습니다.
        // 여기서는 간단히 전체 LED를 해당 색상으로 1번 깜빡입니다.
        JJONeo.setBrightness(50);
        basic.pause(100);
        JJONeo.setBrightness(0);
    }
}
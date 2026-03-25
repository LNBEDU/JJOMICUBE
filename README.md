# JJOMICUBE (micro:bit TFT + ESP32 교육용 확장)

JJOMICUBE는 micro:bit 기반의 교육용 확장 라이브러리로,
TFT LCD(ST7789), ESP32 통신, 그래프 표시, 텍스트 출력 기능을 통합 제공합니다.

학생들이 센서 데이터 시각화, IoT 통신, 인터페이스 제작을 쉽게 배울 수 있도록 설계되었습니다.

---

## ✨ 주요 기능

### 🖥 TFT 디스플레이

* ST7789 320x240 지원
* 픽셀 / 사각형 / 선 / 원 / 삼각형 / 별 그리기
* RGB 색상 직접 생성 지원
* 고속 SPI 기반 출력

### 📊 그래프 표시

* 실시간 센서 그래프
* 단일 / 2채널 그래프
* 자동 / 고정 Y축
* 최소 / 최대 값 표시
* 부드러운 필터링 (EMA)

### 🔤 텍스트 출력

* 5x7 폰트 (영문, 숫자, 기호)
* 7세그 숫자 표시
* 상태 메시지 표시
* WiFi / Bluetooth 아이콘

### 📡 ESP32 통신

* UART 기반 ESP32 제어
* WiFi 연결 / 해제
* Bluetooth 연결
* ThingSpeak 데이터 전송

---

## 🚀 설치 방법 (MakeCode)

1. micro:bit MakeCode 접속
   👉 https://makecode.microbit.org

2. **확장(Extensions)** 클릭

3. GitHub 주소 입력

```
https://github.com/LNBEDU/JJOMICUBE
```

---

## 🧩 기본 사용 예

```typescript
RBTFT20.init()

TFTGraph.drawStatus("시작", RBTFT20.yellow())

ESP32UART.initEsp32()
ESP32UART.connectWifi("SSID", "PASSWORD")

basic.forever(function () {
    if (ESP32UART.isWifiConnected()) {
        basic.showIcon(IconNames.Heart)
        TFTGraph.drawStatus("연결됨", RBTFT20.green())
    } else {
        basic.showIcon(IconNames.No)
        TFTGraph.drawStatus("연결 안됨", RBTFT20.red())
    }

    TFTFont.drawStatusIcons()
    basic.pause(1000)
})
```

---

## 🎨 색상 사용 방법

### 기본 색상

```typescript
RBTFT20.red()
RBTFT20.green()
RBTFT20.blue()
```

### RGB 직접 생성

```typescript
let color = RBTFT20.rgb(255, 120, 0)
```

👉 두 방식 모두 동일하게 사용 가능

---

## 📊 그래프 예제

```typescript
TFTGraph.start1(AnalogPin.P1, "센서")

basic.forever(function () {
    TFTGraph.update()
})
```

---

## 🔧 하드웨어 연결

### TFT (ST7789)

| TFT  | micro:bit |
| ---- | --------- |
| SCK  | P13       |
| MOSI | P15       |
| DC   | P14       |
| VCC  | 3V        |
| GND  | GND       |

※ CS는 GND에 고정

---

### ESP32 (UART)

| ESP32 | micro:bit |
| ----- | --------- |
| TX    | P8        |
| RX    | P12       |

---

## 📁 구성 파일

* `RBTFT20.ts` → TFT 제어
* `TFTGraph.ts` → 그래프
* `TFTFont.ts` → 텍스트/아이콘
* `ESP32UART.ts` → 통신
* `JJONeo.ts` → 네오픽셀
* `JJOADS1115.ts` → ADC

---

## 📜 라이선스

MIT License

이 프로젝트는 다음 오픈소스를 포함합니다:

* Joy-IT / SIMAC Electronics GmbH

---

## 🧑‍🏫 교육 활용

이 라이브러리는 다음 교육에 적합합니다:

* IoT 수업
* 센서 데이터 시각화
* 앱 인벤터 연동
* 로봇 자동차 프로젝트
* AI 데이터 수집

---

## 💡 개발자

**LNBedu (JJOMICUBE)**
교육용 임베디드 / AI 키트 개발

---

## 🔥 향후 계획

* 한글 폰트 지원 (선택적)
* 터치 인터페이스
* 그래프 UI 개선
* 웹 연동 강화

---

// 학생용 데모
TFTGraph.config(2, 2, 1)                 // 굵기=보통, 부드러움=보통, 속도=보통
TFTGraph.start2(AnalogPin.P1, "P1", AnalogPin.P2, "P2")  // 2개 그래프 시작

input.onButtonPressed(Button.A, function () {
    TFTGraph.reset()                      // A: 리셋
})

input.onButtonPressed(Button.B, function () {
    TFTGraph.yAuto()                      // B: 자동 (원하면 yFixed로 바꿔도 됨)
})

basic.forever(function () {
    TFTGraph.update()
})
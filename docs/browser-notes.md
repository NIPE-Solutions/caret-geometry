# Browser notes

| Browser area       | Observed behavior                       | Approach                                          | Removal criteria                                    |
| ------------------ | --------------------------------------- | ------------------------------------------------- | --------------------------------------------------- |
| Collapsed Range    | Can return no rect at empty boundaries  | Neighbor inference, then optional marker          | All target browsers expose reliable collapsed rects |
| RTL control scroll | Native `scrollLeft` models can differ   | Copy the value into a same-engine mirror          | A normalized platform API is universally available  |
| Search controls    | Native decorations vary                 | Assert geometry invariants instead of exact width | Engines expose authoritative text-content geometry  |
| Scaled controls    | The visual box differs from layout size | Map mirror offsets through the source box scale   | Controls expose direct caret rectangles             |

Chromium, Firefox, and WebKit automation covers these invariants. WebKit
automation is not physical Safari-device evidence. Vertical writing modes
remain experimental; rotated, skewed, and 3D controls are outside the stable
contract. No user-agent detection is used.

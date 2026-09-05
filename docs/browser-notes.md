# Browser notes

| Browser area       | Observed behavior                       | Approach                                        | Removal criteria                                    |
| ------------------ | --------------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| Collapsed Range    | Can return no rect at empty boundaries  | Neighbor inference, then optional marker        | All target browsers expose reliable collapsed rects |
| RTL control scroll | `scrollLeft` models historically differ | Assign the source value to a same-engine mirror | A standard normalized API is universally available  |
| Search controls    | Native decorations vary                 | Supported with caveats; validate per engine     | Engines expose authoritative text-content geometry  |

No user-agent detection is used.

# k6 Playground


- [1 Concepts](#1-concepts)
  - [1.1 Virtual users (VUs)](#11-virtual-users-vus)
  - [1.2 Stages](#12-stages)
  - [1.3 Metrics](#13-metrics)
  - [1.4 Checks & Thresholds](#14-checks--thresholds)
    - [Examples](#examples)
- [2 Test lifecycle](#2-test-lifecycle)
- [5 Resources](#5-resources)


## 1 Concepts

### 1.1 Virtual users (VUs)

A **virtual user** is an entity that executes a test, and makes requests.
It simulate a actual user session.

They run concurrently, nad keep repeating the test until the test is over.

```
VUs = (numHourlySessions * avgSessionDurationInSec) / 3600
```

Things we need to simulate are:

* Regulat traffic
* Busiest/peak hour
* Stress test your system


### 1.2 Stages 

```js

stages: [
  { duration: "1m", target: 2000 },
  { duration: "9m", target: 2000 },
  { duration: "3m", target: 10000 },
  { duration: "7m", target: 10000 },
  { duration: "10m", target: 0 },
]
```

* Start from `0` to `2000` users during `1m`  
* Then stay at `2000` users for about `9m`  
* Ramp up to `10000` users for `3m`  
* and stay at the same user traffic for `7m`  
* go down to `0` during `10m`  


### 1.3 Metrics

You can use custom metrics in your test. 

```js 
import { Counter } from "k6/metrics"

let errorsCounter = new Counter("Errors")
//...
errorsCounter.add(1)
```

4 types of custom metrics:
* Counter: Cumulative sum of values
* Gauge: Store the last value added
* Rate: % of non-zero added values 
* Trend: Calculate statistics on the added values (*min, max average, percentiles (p90, p95)*)


### 1.4 Checks & Thresholds

**Checks**: doesn't halt the execution of the test. It is like assertions
**Thresholds**: A global pass/fail criteria that you can configure k6 to use


#### Examples

```js
//
// Check
//
check(res, {
  "check 1": (r) => r.status == 200,
  "check 2": (r) => r.body.length == 1117,
})

//
// Thresholds
//

export let options {
  threshold: {
    "errors": ["rate < 0.1 "], // Custom error Rate using the `Rate` metric from `k6/metrics` 
  }
}
```

## 2 Test lifecycle

```
1. init     (imports + options)
    |
    v
2. Setup    (export function setup() {...})
    |
    v<-----<
    |      |  // looping for the duration of the test
3. VU Code | (export default function(data) {...})
    |      |
    |-->--->
    v
4. Teardown (export function teardown(data) {...})
```
See [2]


## 5 Resources

1. https://test.k6.io/
2. https://k6.io/docs/using-k6/test-life-cycle/
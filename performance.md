# Performance Comparison - Async vs Sync Microservices

## Load Test Results

| Metric | Async Service | Sync Service | Performance Gain |
|--------|---------------|--------------|------------------|
| Mean Response Time | 4.1ms | 11.4ms | **64% faster** |
| Median Response Time | 4ms | 10.9ms | **63% faster** |
| P95 Response Time | 6ms | 16.9ms | **65% faster** |
| P99 Response Time | 7.9ms | 24.8ms | **68% faster** |
| Max Response Time | 17ms | 72ms | **76% better** |
| Total Requests | 567 | 633 | 12% less volume |
| Success Rate | 100% | 100% | Equal |

## 🏆 Winner: Async Service
- Consistently 2-3x faster response times
- More predictable performance (lower max)
- Better user experience under load

## Test Configuration
- Duration: 60 seconds
- Load: 20 requests/second
- Tool: Artillery.js
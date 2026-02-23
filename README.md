# MetricGuard – Real-Time Metric Alerting Platform

A full-stack real-time metric alerting system that allows users to configure alert rules, ingest metric data, evaluate breaches, and view alert history.

This project demonstrates clean architecture, domain separation, reliability awareness, and scalable design thinking.

---

# 1. Overview

MetricGuard is a simple monitoring and alerting System

Users can:

- Create alert rules (threshold + comparator + cooldown)
- Simulate metric values
- Automatically evaluate metrics against configured alerts
- View alert trigger history
- Control alert firing behavior with cooldown

---

# 2. Design Principles Followed

## 1. Separation of Concerns

- Next API routes handle HTTP requests and responses.
- Logic lives inside an Alert Engine module.


## 2. Domain logic

- Alerts are the preset rules.
- Metrics are raw data inputs simulating live data.
- Alert events are immutable records of triggered alerts.


## 3. Reliability

- Input validation at API entry.
- Proper HTTP status response codes.
- Cooldown prevents alert storms.
- RLS enforces User data isolation.

## 4. Production-Oriented Thinking

- Indexes on `(user_id, metric_name)`
- Pagination for alert events
- Immutable event modeling
- Explicit comparator support (GT, LT, GTE, LTE, EQ)

---

# 3. Tech Stack

## Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth (email/password)

## Backend
- Next.js Route Handlers
- Supabase Postgres

## Database
- Postgres (via Supabase)

---

# 4. Information Architecture

## Entities

### Alerts
Configuration rules created by users.

Fields:
- id
- user_id
- metric_name
- threshold
- comparator (GT, LT, GTE, LTE, EQ)
- cooldown_seconds
- last_triggered_at
- created_at
- updated_at

### Metrics
Raw ingested metric values.

Fields:
- id
- user_id
- metric_name
- value
- recorded_at

### Alert Events
Immutable records created when alerts fire.

Fields:
- id
- user_id
- alert_id
- metric_name
- metric_value
- timestamp
- alert_message

---

## Key Workflow

### Metric Ingestion Flow

1. Validate request body.
2. Persist metric.
3. Fetch alerts matching `(user_id, metric_name)`.
4. For each alert:
   - Evaluate comparator.
   - Check cooldown.
   - Insert alert_event if triggered.
   - Update last_triggered_at.
5. Return evaluation summary:
   - evaluated
   - triggered
   - cooldown_skipped

---

# 5. Assumptions and Design Trade-offs

## Alert Firing Behavior

Current implementation:

- Alerts fire when comparator passes AND cooldown is not active.
- If cooldown is 0, alerts fire for every qualifying metric.
- Repeated firing during cooldown window is suppressed.

### Edge Case: Continuous Breach

If metric continuously remains above threshold:
- Alerts may fire again once cooldown expires.
- The system does not currently track state transitions (OK → BREACH).

### Solution: State-Based Firing
- An ideal solution to the above issue is state-based firing, that is if the alert trigers only when state changes, that is if a metric is constantly breached the system doesnt continuously alert.
- Another simpler solution could be not firing if at a constant value, only if value changes
- We have not implemented these solutions as we do not have a data stream but just form based metrics for simulation so these would only be increasing complexity.


---

## Synchronous vs Asynchronous Evaluation

Current approach:
- Evaluation is synchronous inside `/api/metrics`.

Trade-off:
- Simpler logic.
- Deterministic results.
- Lower architectural complexity.

Production alternative:
- Push metrics to a message queue.
- Process alerts asynchronously via workers.
- Improves scalability and resilience.

---

## Duplicate Alert Events

Currently:
- Duplicate events can occur if cooldown is 0 and repeated metric values are ingested.

Production alternative:
- Add state-based firing logic.
- Or introduce deduplication window.
- Or use event idempotency keys.

---

## Metric Persistence

Metrics are stored permanently.

Trade-off:
- Better auditability.
- Enables historical analytics.
- Slight storage overhead.

Production improvement:
- TTL-based retention.
- Aggregation storage (e.g., hourly buckets).

---

## Multi-User Support

System supports multiple users via Supabase Auth.

- Each table contains `user_id`.
- Row Level Security ensures isolation.
- All queries scoped to authenticated user.

---

## Comparator Support

Supported:
- GT
- LT
- GTE
- LTE
- EQ

Extensible design allows adding:
- BETWEEN
- RANGE
- Percentage-based thresholds

### Should alerts fire repeatedly for every breach?
Current: Yes, unless cooldown suppresses, as we have low amount of data instead of a data stream.  
Future: Prefer state-transition-based firing.

### Should cooldown be implemented?
Yes. Cooldown is configurable per alert.

### Should the system support multiple users?
Yes. Implemented with Supabase Auth and RLS.

---

# 6. Reliability Considerations

## Input Validation
- Strong type guards at API boundary.
- ISO timestamp validation.
- Numeric parsing protection.

## Idempotency
- Metric ingestion is not idempotent by design.
- Each ingestion is treated as a new data point.
- Alert events are immutable.

## Backpressure
- Current system processes synchronously.
- High ingestion rates would increase API latency.

Production improvement:
- Queue-based ingestion.
- Rate limiting.
- Circuit breakers.

---

# 6. Performance and Scalability

## Current Optimizations

- Indexed queries on `(user_id, metric_name)`
- Pagination on alert events
- Server-side sorting (newest first)
- Minimal DB round-trips


## How to Scale

- Move evaluation to background worker.
- Batch alert updates in transactions.
- Introduce Redis cache for alert rules.
- Use event streaming for metric ingestion.
- Partition metrics table by time.

---

# 5. Setup and Run Instructions

## 1. Clone Repository

git clone <repo>

## 2. Install Dependencies

npm i

## 3. Configure Environment Variables

Create `.env.local`:

## 4. Run Development Server

npm run dev

App runs at:

---

# 6. Future Improvements

- State-transition-based alert firing
- WebSocket live metric streaming
- Async evaluation pipeline
- Alert severity levels
- Role-based access control
- Real-time dashboard updates
- Dockerization

---

# 7. Conclusion

MetricGuard demonstrates:

- Clean full-stack architecture
- Thoughtful domain modeling
- Practical reliability handling
- Extensible system design
- Production-aware trade-offs

The system is intentionally simple yet structured in a way that enables straightforward scaling and evolution into a distributed alerting engine.

# Route Capsule / Canonical Route — Lab contract

## routeSchemaVersion

- **Capsule envelope** `routeSchemaVersion` = **1** (`navride:capsule`)
- **NavRideRoute** nested payload keeps `schemaVersion` = **1** (`navride:route`)

## Models

| Layer | Purpose |
|-------|---------|
| OriginalTrack | Immutable imported geometry + `contentHash` |
| DerivedRoute | Navigable interpretation (may be passthrough / empty) |
| CanonicalRoute | Source-agnostic consumer facade |
| RouteProvenance | sourceType / versions / hashes |
| RouteCapsule | Persistible bundle |

## GPX

```xml
<extensions>
  <navride:route><![CDATA[{ schemaVersion:1, ... }]]></navride:route>
  <navride:capsule><![CDATA[{ routeSchemaVersion:1, ... }]]></navride:capsule>
</extensions>
```

Namespace: `https://navride.app/ns/gpx/v1`

Capsule JSON is **compact**: no duplicated full `trackPoints` (geometry lives in `<trk>`).

## Compatibility

| Input | Behavior |
|-------|----------|
| External GPX | Import OK; capsule generated on save/export |
| Old NavRide GPX (route only) | Import OK; capsule synthesized in memory |
| Enriched GPX | Capsule + route parsed; third parties ignore extensions |

## App ↔ Web

- Dart: `app/lib/route/canonical/*`
- TS: `web-navride/.../route-capsule.ts` + `gpx-codec.ts`
- Shared NS + `routeSchemaVersion=1`

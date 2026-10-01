# Route Capsule / Canonical Route — Lab contract (v2)

## Versions

| Envelope | Value | Notes |
|----------|-------|-------|
| `routeSchemaVersion` writer | **2** | Campaign: match metadata + dataset versions |
| Readable min | **1** | Exp01 capsules remain valid |
| `NavRideRoute.schemaVersion` | **1** | Unchanged nested payload |

App: `kRouteSchemaVersion=2`, `kRouteSchemaVersionMin=1`  
Web: `ROUTE_SCHEMA_VERSION=2`, `ROUTE_SCHEMA_VERSION_MIN=1`

## Models

| Layer | Purpose |
|-------|---------|
| OriginalTrack | Immutable imported geometry + `contentHash` |
| DerivedRoute | Navigable interpretation (attach / passthrough / reject) |
| CanonicalRoute | Source-agnostic consumer facade |
| RouteProvenance | sourceType / versions / hashes |
| RouteCapsule | Persistible bundle |

## Match acceptance (DerivedRoute.accessAttributes)

`matchAcceptance`: `ACCEPTED` | `LOW_CONFIDENCE` | `REJECTED`

**BAD MATCH → REJECT** (never force). On reject: empty matched geometry; OriginalTrack intact.

## GPX

```xml
<extensions>
  <navride:route><![CDATA[{ schemaVersion:1, ... }]]></navride:route>
  <navride:capsule><![CDATA[{ routeSchemaVersion:1|2, ... }]]></navride:capsule>
</extensions>
```

Namespace: `https://navride.app/ns/gpx/v1`

## Routing policy (app)

ACCESS ≠ PREFERENCE ≠ COST — see `navigation/routing/policy/*`.  
CAR ≠ MOTO preferences documented in `RoadPreferencePolicy`.

## Map style ≠ routing

`MapVisualStyle.role`: road / topo / offroad / satellite.  
Changing style never changes `TransportMode`.

## Hierarchical routing

**HIERARCHICAL_ROUTING: NOT_NEEDED** — Valhalla on-device already handles long routes; no HH rewrite.

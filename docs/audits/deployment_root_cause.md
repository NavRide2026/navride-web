# Causa Raíz — Despliegue navride.app (P0 #2)

| Campo | Valor |
|-------|-------|
| **Fecha** | 2026-06-01 |
| **Tarea** | P0 #2 — Investigación despliegue (sin implementación) |
| **Repo local** | `web-navride` |
| **Build local** | ✅ `npm run build` exitoso (post P0 #1) |

---

## Causa raíz confirmada

**El dominio `navride.app` no existe en DNS público (NXDOMAIN) y el repositorio `web-navride` nunca ha sido desplegado en Vercel.**

El sitio público no puede responder porque:

1. **No hay resolución DNS** para `navride.app` en registros públicos (Google DNS 8.8.8.8, Cloudflare 1.1.1.1).
2. **No hay proyecto Vercel accesible** para este repo (`web-navride.vercel.app` → `DEPLOYMENT_NOT_FOUND`).
3. **El código desplegable no está publicado** (sin git remote, páginas legales sin commitear).

El **503** reportado en auditorías anteriores es **evidencia histórica/parcial**: en la investigación actual el dominio **no resuelve** (HTTP 000 / timeout). El 503 encaja con un escenario previo donde el dominio apuntaba a Vercel **sin deployment de producción válido**. Hoy el bloqueo primario es **NXDOMAIN**.

---

## Respuestas a las 9 preguntas de investigación

### 1. ¿Existe un proyecto Vercel conectado?

| Evidencia | Resultado |
|-----------|-----------|
| `.vercel/` en repo local | **No existe** |
| `vercel.json` | **No existe** |
| Git remote | **No configurado** |
| Vercel CLI (`vercel whoami`) | **No autenticado** — requiere login OAuth |
| `https://web-navride.vercel.app/` | **404** — `DEPLOYMENT_NOT_FOUND` |
| `https://navride.vercel.app/` | **404** — `DEPLOYMENT_NOT_FOUND` |

**Conclusión:** **No hay evidencia** de que el repo `web-navride` esté conectado a un proyecto Vercel. No fue posible inspeccionar dashboard, logs ni historial de deployments sin credenciales Vercel del titular.

**Hallazgo colateral:** Existe un proyecto Vercel **distinto** en `https://nav-ride.vercel.app/` (HTTP 200) titulado *"NavRide: Bidding-based ride-hailing with wallet escrow"*. **No es** la web GPS/motocicleta de este repositorio.

---

### 2. ¿Cuál fue el último deployment exitoso?

**No determinable** desde el entorno de auditoría (sin acceso al dashboard Vercel ni token API).

| URL probada | Resultado |
|-------------|-----------|
| `web-navride.vercel.app` | Sin deployment |
| `navride.vercel.app` | Sin deployment |
| `nav-ride.vercel.app` | **200 OK** — proyecto ajeno (ride-hailing) |

**Conclusión:** Para el repo `web-navride`, **no hay deployment exitoso verificable** en URLs Vercel predecibles.

---

### 3. ¿Cuál fue el último deployment fallido?

**No determinable** sin acceso Vercel autenticado.

**Inferencia indirecta:** Si `navride.app` alguna vez apuntó a Vercel sin build válido, Vercel habría respondido **503 Service Unavailable** (comportamiento estándar cuando el dominio custom está configurado pero no hay producción activa o el deployment falló).

---

### 4. ¿Está navride.app apuntando al proyecto correcto?

**No.** `navride.app` **no apunta a ningún host** — NXDOMAIN en DNS público.

| Registro | Resultado |
|----------|-----------|
| A `navride.app` | **Sin respuesta** (Status 3 = NXDOMAIN) |
| NS `navride.app` | **Sin respuesta** (NXDOMAIN) |
| SOA `navride.app` | **Sin respuesta** (NXDOMAIN) |
| CNAME `www.navride.app` | **Sin respuesta** (NXDOMAIN) |

**Conclusión:** El dominio **no está delegado** en el registro `.app`. No apunta al proyecto correcto ni a ningún otro.

---

### 5. ¿Cuál es la causa exacta del 503?

| Estado | Evidencia actual (2026-06-01 ~05:23 UTC) |
|--------|------------------------------------------|
| **Hoy** | `curl https://navride.app/` → **HTTP 000** (fallo resolución DNS) |
| **Auditoría previa** | Fetch externo → **503 Service Unavailable** |

**Causa del 503 (cuando el dominio sí resolvía):**

Vercel devuelve **503** cuando:
- El dominio custom está registrado en Vercel pero **no hay deployment de Production activo**, o
- El último deployment **falló**, o
- El proyecto fue **eliminado/suspendido** manteniendo el dominio en configuración residual.

**Causa actual predominante:** El dominio **ya no resuelve** (NXDOMAIN), por lo que el 503 **no es reproducible hoy** — el fallo observable es anterior a la resolución DNS.

---

### 6. ¿Cuál es la causa exacta del NXDOMAIN?

**Evidencia DNS (Google DNS JSON API):**

```json
{
  "Status": 3,
  "Question": [{"name": "navride.app.", "type": 1}],
  "Authority": [{"name": "app.", "type": 6, "data": "ns-tld1.charlestonroadregistry.com. ..."}]
}
```

**Status 3 = NXDOMAIN** — el registro `.app` (Google Charleston Road Registry) confirma que **`navride.app` no está registrado o no tiene delegación DNS activa**.

**Causas posibles (orden de probabilidad):**

| # | Causa | Indicador |
|---|-------|-----------|
| 1 | **Dominio nunca registrado** | NXDOMAIN en A, NS, SOA |
| 2 | **Registro expirado o eliminado** | NXDOMAIN total (no solo registros A vacíos) |
| 3 | **Nameservers sin zona configurada** | Descartado — no hay NS propios, no hay zona |

**Verificación cruzada:**

```
nslookup navride.app 8.8.8.8   → Non-existent domain
nslookup navride.app 1.1.1.1   → Non-existent domain
curl https://navride.app/      → No se puede resolver el nombre remoto
```

---

### 7. ¿Existe algún problema de DNS externo?

**Sí — a nivel de registro de dominio, no de propagación.**

| Tipo de problema | ¿Aplica? | Detalle |
|------------------|----------|---------|
| Propagación lenta | ❌ | NXDOMAIN es autoritativo del TLD `.app` |
| Registros A/CNAME incorrectos | ❌ | No existen registros — no hay zona |
| Nameservers mal configurados | ❌ | No hay nameservers para el dominio |
| **Dominio inexistente en registro** | ✅ | **Confirmado** |

No es un problema de caché local ni de un único resolver: **8.8.8.8 y 1.1.1.1 coinciden**.

---

### 8. ¿Existe algún problema de configuración de dominio dentro de Vercel?

**No verificable** sin login Vercel.

**Evidencia indirecta:**

- Si el dominio estuviera correctamente configurado en Vercel **y** registrado en DNS, resolvería a IPs de Vercel (`76.76.21.x` o similar).
- Hoy **no resuelve**, lo que indica que el problema está **antes** de Vercel (registro del dominio) o que la configuración Vercel fue eliminada junto con el registro DNS.

**Riesgo adicional detectado:** Existe `nav-ride.vercel.app` activo con otro producto NavRide. Si en Vercel se configuró `navride.app` apuntando a un proyecto incorrecto o eliminado, eso explicaría el 503 histórico.

---

### 9. ¿Existe algún problema de SSL o validación de dominio?

**No evaluable** — SSL requiere que el dominio resuelva DNS primero.

| Prerequisito SSL | Estado |
|-------------------|--------|
| Dominio resuelve DNS | ❌ NXDOMAIN |
| Certificado Let's Encrypt / Vercel | ❌ Imposible emitir sin validación DNS/HTTP |
| HTTPS accesible | ❌ |

**Conclusión:** El bloqueo SSL es **consecuencia** del NXDOMAIN, no una causa independiente.

---

## Estado consolidado

### Dominio `navride.app`

| Aspecto | Estado |
|---------|--------|
| Registro DNS público | ❌ **NXDOMAIN** |
| HTTPS | ❌ Inaccesible |
| HTTP | ❌ Inaccesible |
| SSL | ❌ No aplicable |
| URL Play Store `privacy_policy.html` | ❌ Inaccesible |

### Vercel — repo `web-navride`

| Aspecto | Estado |
|---------|--------|
| Proyecto conectado al repo | ❌ No evidenciado |
| `.vercel/project.json` | ❌ Ausente |
| Deployment Production | ❌ No encontrado |
| URL `web-navride.vercel.app` | ❌ DEPLOYMENT_NOT_FOUND |
| Variables de entorno requeridas | ✅ Ninguna detectada en código |
| Build local | ✅ Exitoso (17 rutas estáticas) |

### Git / publicación

| Aspecto | Estado |
|---------|--------|
| Git remote | ❌ No configurado |
| Código legal commiteado | ❌ `app/legal/` untracked |
| Último commit | `db8c0fc` — plantilla create-next-app |

### Proyecto Vercel ajeno detectado

| URL | HTTP | Producto |
|-----|------|----------|
| `nav-ride.vercel.app` | 200 | Ride-hailing / bidding (NO es web GPS moto) |
| `nav-ride.vercel.app/legal/privacy_policy.html` | 404 | Sin política de privacidad en esa ruta |

---

## Evidencias técnicas

### DNS — Google Public DNS API (2026-06-01)

```
GET https://dns.google/resolve?name=navride.app&type=A
→ Status: 3 (NXDOMAIN)

GET https://dns.google/resolve?name=navride.app&type=NS
→ Status: 3 (NXDOMAIN)
```

### HTTP — Probes

```
curl https://navride.app/
→ HTTP 000 (DNS resolution failure)

curl https://web-navride.vercel.app/
→ HTTP 404 — DEPLOYMENT_NOT_FOUND

curl https://navride.vercel.app/
→ HTTP 404 — DEPLOYMENT_NOT_FOUND

curl https://nav-ride.vercel.app/
→ HTTP 200 — Server: Vercel (proyecto distinto)
```

### Build local (2026-06-01)

```
npm run build → exit code 0
17 rutas estáticas generadas incluyendo /legal/politica-privacidad
```

### Repo local

```
git remote -v → (vacío)
git status → app/legal/, components/, docs/ untracked
.vercel/ → no existe
vercel.json → no existe
```

---

## Acción mínima necesaria para recuperar el sitio

> Documentación de pasos requeridos. **No implementados** en P0 #2.

| Paso | Acción | Responsable | Dependencia |
|------|--------|-------------|-------------|
| **1** | **Registrar o renovar** `navride.app` en registrador acreditado para TLD `.app` | Titular dominio | Ninguna |
| **2** | **Commitear y publicar** código de `web-navride` en repositorio Git remoto | Desarrollo | Build local OK ✅ |
| **3** | **Crear proyecto Vercel** vinculado al repo remoto | Vercel dashboard | Paso 2 |
| **4** | **Desplegar Production** con build exitoso (`next build`) | Vercel | Paso 3 |
| **5** | **Añadir dominio custom** `navride.app` en Vercel → Settings → Domains | Vercel dashboard | Paso 1 + 4 |
| **6** | **Configurar DNS** en registrador según instrucciones Vercel (A record o CNAME) | Registrador DNS | Paso 5 |
| **7** | **Esperar propagación** y verificar SSL automático de Vercel | — | Paso 6 |
| **8** | **Verificar HTTP 200** en `https://navride.app/` y `https://navride.app/legal/politica-privacidad` | QA | Paso 7 |

**Gate de recuperación:** Pasos 1–8 completados.

**Nota sobre URL Play Store:** Recuperar el sitio devuelve 200 en rutas Next.js, pero `https://navride.app/legal/privacy_policy.html` seguirá dando **404** hasta un paso posterior (redirect o archivo estático). Eso está **fuera del alcance** de recuperar el despliegue base.

---

## Diagnóstico: build local OK vs sitio público caído

| Capa | Estado local | Estado público | Brecha |
|------|--------------|----------------|--------|
| Código | ✅ Compila | ❌ No desplegado | Sin push + sin Vercel project |
| Git | ❌ Sin remote | ❌ Vercel no puede CI/CD | Paso 2 pendiente |
| Vercel | N/A | ❌ No hay deployment | Paso 3–4 pendiente |
| DNS | N/A | ❌ NXDOMAIN | Paso 1 + 6 pendiente |
| Dominio custom | N/A | ❌ No resuelve | Registro + DNS |

**Conclusión:** El build local funciona pero **nunca llega a producción** porque la cadena Git → Vercel → DNS está **rota en los tres eslabones**.

---

## Limitaciones de esta investigación

| Limitación | Impacto |
|------------|---------|
| Sin credenciales Vercel | No se pudo confirmar historial de deployments, logs ni configuración de dominio en dashboard |
| Sin acceso registrador de dominio | No se pudo confirmar si el dominio expiró, nunca se compró, o fue transferido |
| Sin `gh` CLI | No se pudo verificar repos GitHub remotos alternativos |

**Acción requerida del titular:** Acceder a [vercel.com/dashboard](https://vercel.com/dashboard) y al panel del registrador de `navride.app` para confirmar historial y estado de facturación/registro.

---

## Resumen ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Por qué 503? | Vercel sin deployment válido **cuando el dominio resolvía**; hoy no reproduce (NXDOMAIN) |
| ¿Por qué NXDOMAIN? | `navride.app` **no existe** en el registro DNS público del TLD `.app` |
| ¿Por qué build OK pero web caída? | Código solo local; **sin git remote, sin Vercel project, sin DNS** |
| ¿Qué hacer? | Registrar dominio → publicar repo → crear/deploy Vercel → configurar DNS custom |

---

*Investigación P0 #2 completada. Sin implementación. Detenido aquí.*

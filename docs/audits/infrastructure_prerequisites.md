# Prerrequisitos de Infraestructura — Activos y Preguntas al Propietario

| Campo | Valor |
|-------|-------|
| **Fecha** | 2026-06-01 |
| **Modo** | Auditoría previa (sin implementación) |
| **Alcance** | Identificar activos reales antes de recuperación de infraestructura |

---

## 1. Búsqueda en el proyecto

### Referencias buscadas

| Término | En código fuente (`app/`, `components/`, configs) | En `docs/` |
|---------|--------------------------------------------------|------------|
| `navride.app` | **0 referencias** | Sí (auditorías) |
| `vercel.app` | **0 referencias** | Sí (auditorías) |
| `github.com` | Solo plantilla README + sponsors en `package-lock.json` | No |
| `deployment` | **0 referencias** | Sí (auditorías) |
| `production` | Solo comentario `# production` en `.gitignore` | Sí (auditorías) |
| `domain` | **0 referencias** | Sí (auditorías) |

### Archivos revisados

| Archivo | Contenido relevante para infraestructura |
|---------|-------------------------------------------|
| `README.md` | Plantilla create-next-app. Mención genérica a Vercel y GitHub de Next.js. **Sin dominio, sin repo, sin URLs de prod.** |
| `package.json` | `"name": "web-navride"`. Scripts: `dev`, `build`, `start`, `lint`. **Sin homepage, repository, ni bugs URL.** |
| `next.config.ts` | Vacío. **Sin dominio, redirects, ni output.** |
| `vercel.json` | **No existe** |
| `.env*` | **No existen** en repo |
| `.gitignore` | Ignora `.vercel`, `.env*`, `/build`, `/.next/` |
| `docs/audits/*` | 4 informes de auditoría (única documentación operativa del dominio/despliegue) |
| Páginas legales | Titular: Daniel Montero Mora. Email: `navride@outlook.com`. **Sin URL de web oficial embebida.** |

**Conclusión documental:** El repositorio **no contiene** documentación histórica de dominio, cuenta Vercel, repositorio GitHub ni URLs de producción. Toda esa información proviene de **contexto externo** (Google Play, auditorías de red) o **desconocida**.

---

## 2. Activos confirmados

### Repositorio local

| Activo | Estado | Evidencia |
|--------|--------|-----------|
| Proyecto Next.js | ✅ Existe | `package.json`, `app/`, `components/` |
| Nombre npm | ✅ `web-navride` | `package.json` |
| Framework | ✅ Next.js 16.2.6 + React 19 | `package.json` |
| Build local | ✅ Exitoso (post P0 #1) | `docs/audits/build_fix_report.md` |
| Git inicializado | ✅ Sí | `.git/` presente |
| Único commit en git | ✅ `db8c0fc` — plantilla create-next-app | `git log` |
| Git remote | ❌ **No configurado** | `git remote -v` vacío |
| Código legal/web actual | ⚠️ Existe en disco, **sin commitear** | `git status` — `app/legal/` untracked |

### Contenido web (local)

| Activo | Estado |
|--------|--------|
| Páginas legales | ✅ 7 rutas implementadas en `app/legal/` |
| Política privacidad | ✅ `/legal/politica-privacidad` |
| Eliminación datos | ✅ `/legal/eliminacion-datos` |
| Contacto embebido | ✅ `navride@outlook.com` en páginas legales |
| Titular legal | ✅ Daniel Montero Mora (DNI en privacidad) |
| URL Play `privacy_policy.html` | ❌ No existe en repo |

### Configuración de despliegue (local)

| Activo | Estado |
|--------|--------|
| `vercel.json` | ❌ No existe |
| `.vercel/project.json` | ❌ No existe |
| Variables de entorno | ❌ No requeridas detectadas en código |
| `next.config.ts` custom | ❌ Vacío |

### Documentación generada (auditorías)

| Documento | Contenido |
|-----------|-----------|
| `docs/audits/web_google_play_audit.md` | Arquitectura, legales, 503, Play compliance |
| `docs/audits/web_release_blockers_master.md` | Bloqueadores P0/P1/P2 |
| `docs/audits/build_fix_report.md` | Build corregido |
| `docs/audits/deployment_root_cause.md` | NXDOMAIN, Vercel, causa raíz despliegue |

### Activos externos verificados (fuera del repo, en auditorías previas)

| Activo | Estado | Nota |
|--------|--------|------|
| `https://navride.app` | ❌ NXDOMAIN (2026-06-01) | No resuelve DNS público |
| `https://navride.app/legal/privacy_policy.html` | ❌ Inaccesible | URL reportada en Google Play |
| `https://web-navride.vercel.app` | ❌ DEPLOYMENT_NOT_FOUND | No hay deployment |
| `https://navride.vercel.app` | ❌ DEPLOYMENT_NOT_FOUND | No hay deployment |
| `https://nav-ride.vercel.app` | ✅ HTTP 200 | **Proyecto distinto** (ride-hailing, no web GPS moto) |

---

## 3. Activos desconocidos

| # | Activo | Por qué es desconocido |
|---|--------|------------------------|
| U-01 | **Propiedad de `navride.app`** | No hay WHOIS, registrador ni facturas en el repo |
| U-02 | **Estado de registro del dominio** | DNS público devuelve NXDOMAIN; no se sabe si expiró o nunca se registró |
| U-03 | **Cuenta Vercel del titular** | Sin `.vercel/`, sin CLI autenticada, sin dashboard accesible |
| U-04 | **Proyecto Vercel asociado a esta web** | `web-navride.vercel.app` y `navride.vercel.app` no tienen deployment |
| U-05 | **Relación con `nav-ride.vercel.app`** | Proyecto activo en Vercel pero producto diferente; titular desconocido |
| U-06 | **Repositorio GitHub (o Git remoto) esperado** | Sin remote, sin URL en `package.json`, sin docs |
| U-07 | **Historial de deployments** | Sin acceso Vercel; imposible confirmar último exitoso/fallido |
| U-08 | **URL de producción histórica real** | Solo inferida: `navride.app` (Play Store) — no documentada en código |
| U-09 | **Quién configuró DNS anteriormente** | Sin registros en repo |
| U-10 | **Origen exacto de URL Play Store** | `privacy_policy.html` no existe en repo; probablemente configurada manualmente en Play Console |
| U-11 | **Credenciales registrador / Vercel / GitHub** | No presentes (correctamente ausentes del repo) |
| U-12 | **Facturación / plan Vercel** | Desconocido |
| U-13 | **¿Existió otro repo o fork previo?** | Sin evidencia en git local |

---

## 4. Preguntas obligatorias al propietario

> Deben responderse **antes** de ejecutar recuperación de infraestructura. Sin estas respuestas, cualquier despliegue es especulativo.

### Dominio

| ID | Pregunta |
|----|----------|
| D-01 | ¿Registraste alguna vez `navride.app`? ¿En qué proveedor (Google Domains, Cloudflare, Namecheap, GoDaddy, etc.)? |
| D-02 | ¿Con qué cuenta/email está (o estaba) el registro del dominio? |
| D-03 | ¿El dominio está activo, expirado o nunca fue comprado? |
| D-04 | ¿Tienes acceso al panel del registrador hoy? |
| D-05 | ¿Configuraste alguna vez DNS para `navride.app`? ¿Recuerdas los registros (A, CNAME, nameservers)? |
| D-06 | ¿`navride.app` debe ser el dominio definitivo o se considera otro (`www`, subdominio)? |

### Vercel

| ID | Pregunta |
|----|----------|
| V-01 | ¿Tienes cuenta Vercel? ¿Con qué email? |
| V-02 | ¿Creaste algún proyecto Vercel para NavRide / web-navride? |
| V-03 | ¿Recuerdas el nombre exacto del proyecto en Vercel? |
| V-04 | ¿Añadiste `navride.app` como dominio custom en algún proyecto Vercel? |
| V-05 | ¿Conoces el proyecto `nav-ride.vercel.app` (ride-hailing)? ¿Es tuyo, de un tercero, o un error? |
| V-06 | ¿Tienes acceso al dashboard Vercel para revisar deployments y logs? |
| V-07 | ¿Hay otros miembros del equipo con acceso Vercel que debamos incluir? |

### Git / GitHub

| ID | Pregunta |
|----|----------|
| G-01 | ¿Existe un repositorio GitHub (u otro Git remoto) para este proyecto? ¿Cuál es la URL? |
| G-02 | ¿Con qué cuenta/organización de GitHub debe vivir el repo? |
| G-03 | ¿El código actual en `Desktop/web-navride` es la fuente de verdad o hay otra copia más actualizada? |
| G-04 | ¿Hubo algún push previo a un remoto o todo el trabajo es solo local? |

### Google Play / URLs de producción

| ID | Pregunta |
|----|----------|
| P-01 | ¿Quién configuró `https://navride.app/legal/privacy_policy.html` en Play Console? |
| P-02 | ¿Esa URL funcionó alguna vez? ¿Cuándo dejó de funcionar? |
| P-03 | ¿Hay capturas, emails o registros de cuando el sitio estuvo activo? |
| P-04 | ¿La URL de privacidad debe ser `privacy_policy.html` o puede cambiarse a `/legal/politica-privacidad`? |

### Titularidad y acceso

| ID | Pregunta |
|----|----------|
| A-01 | ¿Daniel Montero Mora (`navride@outlook.com`) es el titular de dominio, Vercel y Play Console? |
| A-02 | ¿Hay otra persona u organización con acceso a registrador, Vercel o GitHub? |
| A-03 | ¿Dispones de facturas o confirmaciones de compra del dominio `.app`? |

---

## 5. Matriz de decisión pre-recuperación

| Si el propietario confirma… | Entonces… |
|----------------------------|-----------|
| Dominio **nunca registrado** | Paso 1 = registrar `navride.app` antes de DNS/Vercel |
| Dominio **expirado** | Paso 1 = renovar/recuperar en registrador original |
| Dominio **activo en otro registrador** | Paso 1 = obtener acceso y configurar DNS hacia Vercel |
| **Sin cuenta Vercel** | Crear cuenta + proyecto nuevo |
| **Cuenta Vercel existente** | Localizar proyecto correcto (no confundir con `nav-ride`) |
| **Sin repo GitHub** | Crear repo + push antes de conectar Vercel |
| **Repo GitHub existente** | Confirmar URL y sincronizar código local |

---

## 6. Resumen

| Categoría | Confirmado | Desconocido |
|-----------|------------|-------------|
| Código web local | ✅ Sí, build OK | — |
| Documentación infra en repo | ❌ No existe | Dominio, Vercel, GitHub |
| Dominio `navride.app` | ❌ No resuelve DNS | Propiedad, registrador, historial |
| Proyecto Vercel este repo | ❌ No desplegado | Cuenta, historial deployments |
| Git remoto | ❌ No configurado | URL repo esperado |
| URL Play Store | ⚠️ Referenciada externamente | Origen, historial funcionamiento |
| Titular operativo | ✅ Daniel Montero / navride@outlook.com | Accesos a paneles externos |

**Bloqueo de recuperación:** Sin respuestas a las preguntas D-01 a D-06, V-01 a V-06 y G-01 a G-04, **no es posible ejecutar la recuperación con certeza**.

---

*Auditoría de prerrequisitos. Sin implementación. Sin cambios en infraestructura.*

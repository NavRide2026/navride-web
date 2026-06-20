# URL pública — Política de privacidad (Google Play)

**Última actualización:** 2026-05-30  
**Fuente en repo:** `assets/legal/privacy_policy.html`  
**Autoridad app:** `lib/legal/navride_legal_content.dart` (debe mantenerse alineada)

## URL para Play Console (activa — OMEGA-P0-005)

```
https://navride2026.github.io/NavRide/legal/privacy_policy.html
```

Definida en `NavRideLegalCatalog.privacyPolicyPublicUrl`.

**Despliegue:** GitHub Pages vía `.github/workflows/deploy-legal-pages.yml` (push a `main` con cambios en `assets/legal/`).

**Dominio futuro:** `https://navride.app/legal/privacy_policy.html` — cuando DNS/hosting esté operativo, actualizar catálogo y Play Console.

## Verificación post-despliegue

1. Settings → Pages → Source = **GitHub Actions**
2. Tras push a `main`, workflow `Deploy Legal Pages` debe completar
3. Abrir URL en incógnito → HTTP **200**, HTTPS, sin login
4. Pegar URL en Play Console → Política de privacidad

## Consistencia

| Canal | Archivo |
|-------|---------|
| App (Ajustes → Legal) | `NavRideLegalContent.privacyPolicy` |
| Consentimiento inicial | `PrivacyPolicyPage` → misma fuente |
| Play Store (web) | `assets/legal/privacy_policy.html` |

**Checklist despliegue completo:** `docs/legal/PRIVACY_POLICY_DEPLOYMENT_CHECKLIST.md`  
**Data Safety Play:** `docs/OEM_PLAY_STORE_DATA_SAFETY_INVENTORY.md`

No desplegar hasta revisión legal final; la estructura y URL objetivo quedan preparadas.

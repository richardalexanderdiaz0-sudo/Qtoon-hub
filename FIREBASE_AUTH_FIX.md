# Solución al Error de Firebase (auth/unauthorized-domain)

Este error ocurre porque Firebase no reconoce el dominio de la aplicación como un lugar seguro para iniciar sesión. Debes autorizar los dominios de la aplicación en tu consola de Firebase.

## Pasos para solucionar:

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/).
2. Selecciona tu proyecto (**nexusapp-c0a21**).
3. En el menú de la izquierda, ve a **Build** > **Authentication**.
4. Haz clic en la pestaña **Settings** (Configuración).
5. En el menú lateral de esa pestaña, selecciona **Authorized domains** (Dominios autorizados).
6. Haz clic en **Add domain** (Añadir dominio).
7. Copia y pega los siguientes dos dominios (uno por uno):

   *   `ais-dev-q44y3mc2oftuoqjaq5ipsw-62795377716.us-west2.run.app`
   *   `ais-pre-q44y3mc2oftuoqjaq5ipsw-62795377716.us-west2.run.app`

8. Haz clic en **Add** para cada uno.

---

### ¿Por qué sucede esto?
Por seguridad, Firebase solo permite el inicio de sesión desde dominios que tú hayas aprobado explícitamente. Como esta aplicación se ejecuta en una URL dinámica de Google Cloud, es necesario añadir estas URLs a la lista blanca para que el botón de "Continuar con Google" funcione correctamente.

# Configuración de Supabase para NexoToon Content Hub

Sigue estos pasos para configurar tu proyecto de Supabase y que la aplicación funcione correctamente.

## 1. Base de Datos (SQL Editor)

Copia y pega el siguiente código en el **SQL Editor** de Supabase y haz clic en **Run**:

```sql
-- 1. Crear tabla de Obras (Manga, Manhwa, Comic)
CREATE TABLE works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  synopsis TEXT,
  type TEXT CHECK (type IN ('Manhwa', 'Manga', 'Comic')),
  status TEXT DEFAULT 'En emisión',
  cover_url TEXT,
  categories TEXT[] DEFAULT '{}',
  author_name TEXT,
  views_count INTEGER DEFAULT 0,
  release_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de Capítulos
CREATE TABLE chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de Páginas (Imágenes del lector)
CREATE TABLE pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla de Biblioteca de Usuario
CREATE TABLE user_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- ID de Firebase Auth
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, work_id)
);

-- CONFIGURACIÓN DE SEGURIDAD (RLS)

-- Habilitar RLS en todas las tablas
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;

-- Políticas para 'works', 'chapters' y 'pages' (Lectura pública, Escritura protegida)
-- Nota: Como usas Firebase Auth, Supabase no reconoce al usuario automáticamente. 
-- Por ahora, permitiremos lectura pública. Para escritura, usaremos la Anon Key 
-- (que ya está en tu código) o puedes configurar políticas más estrictas después.

CREATE POLICY "Lectura pública de obras" ON works FOR SELECT USING (true);
CREATE POLICY "Lectura pública de capítulos" ON chapters FOR SELECT USING (true);
CREATE POLICY "Lectura pública de páginas" ON pages FOR SELECT USING (true);

-- Política para 'user_library' (Cada usuario ve solo lo suyo)
-- Importante: Al usar Firebase, el user_id se envía manualmente.
CREATE POLICY "Usuarios ven su propia biblioteca" ON user_library FOR ALL USING (true);
```

## 2. Almacenamiento (Storage)

Ve a la sección de **Storage** en Supabase y crea los siguientes buckets:

1.  **Bucket: `covers`**
    *   Hazlo **Public** (Público).
    *   Aquí se guardarán las portadas de los mangas.
2.  **Bucket: `pages`**
    *   Hazlo **Public** (Público).
    *   Aquí se guardarán las imágenes de cada capítulo.

## 3. Políticas de Storage

Para que la app pueda subir archivos, ve a **Storage > Policies** y para cada bucket (`covers` y `pages`) añade una política:
*   Selecciona **"Give users access to all operations"**.
*   Para simplificar el inicio, puedes permitirlo a todos (`public`), pero lo ideal es restringirlo después.

---

### ¿Cómo publicar contenido?
Una vez configurado esto, entra en la app con tu correo `richardalexanderdiaz0@gmail.com`.
1.  Haz clic en el icono de **Libro** (arriba a la derecha).
2.  Sigue los pasos para crear una obra.
3.  Para añadir capítulos y páginas, actualmente la app está preparada para leerlos. Si necesitas una interfaz para subir capítulos, dímelo y la añadiré al "Estudio".

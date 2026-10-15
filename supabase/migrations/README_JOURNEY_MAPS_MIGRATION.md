# User Journey Maps - Database Migration Guide

## Übersicht

Diese Migration erneuert die User Journey Maps-Datenbankstruktur mit folgenden Verbesserungen:

### Neue Features
- **Proper Foreign Keys**: Persona und User Stories sind jetzt mit Foreign Keys verknüpft
- **Timeline Junction Table**: Separate Tabelle für Timeline-Verwaltung mit:
  - Duplikate erlaubt (gleiche Story kann mehrmals vorkommen)
  - Exakte Reihenfolge durch `position` field
  - Einfaches Hinzufügen/Entfernen von Stories
- **AI Optimize Flag**: `ai_optimize_timeline` boolean field

### Datenbank-Struktur

#### `user_journey_maps` (Haupttabelle)
```sql
- id (UUID)
- project_id (UUID) → projects
- title (TEXT)
- description (TEXT)
- persona_id (UUID) → personas (FK)
- ai_optimize_timeline (BOOLEAN)
- stages (JSONB)
- created_at, updated_at, created_by
```

#### `user_journey_map_timeline` (Junction Table)
```sql
- id (UUID)
- journey_map_id (UUID) → user_journey_maps (FK)
- user_story_id (UUID) → user_stories (FK)
- position (INTEGER) - Timeline position (0, 1, 2, ...)
- created_at
```

## Migration durchführen

### 1. Datenbank-Migration ausführen

```bash
# In Supabase Dashboard:
# SQL Editor → New Query → Paste Migration

# Oder mit Supabase CLI:
supabase db push
```

**Migration-Datei**: `20251115001_rebuild_user_journey_maps.sql`

### 2. Wichtige Änderungen

#### Code-Änderungen (bereits erledigt):
- ✅ TypeScript Types aktualisiert (`lib/types/database.ts`)
- ✅ Validation Schemas aktualisiert (`lib/validations/user-journey-map.ts`)
- ✅ API Routes aktualisiert (`app/api/projects/[id]/user-journey-maps/**`)
- ✅ React Hooks (keine Änderung nötig)
- ✅ UI Komponenten aktualisiert (`components/features/user-journey-maps/UserJourneyMapForm.tsx`)
- ✅ Environment Config: `USE_LOCAL_STORAGE = false`
- ✅ OpenAI Integration: `OPENAI_API_KEY` verwendet

#### Konfiguration aktualisiert:
```typescript
// lib/config/environment.ts
export const USE_LOCAL_STORAGE = false  // Jetzt Supabase DB nutzen
export const USE_AI_API = true          // OpenAI nutzen
```

## Rollback (falls nötig)

Falls Probleme auftreten, kannst du zur alten Struktur zurückkehren:

```bash
# In Supabase Dashboard SQL Editor:
# Führe aus: 20251115002_rollback_rebuild_user_journey_maps.sql
```

## Testen

### 1. Migration verifizieren

```sql
-- Prüfe ob Tabellen existieren
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_journey_maps', 'user_journey_map_timeline');

-- Prüfe Foreign Keys
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
AND conrelid::regclass::text LIKE '%journey%';
```

### 2. App testen

1. **Starte den Dev-Server**:
   ```bash
   npm run dev
   ```

2. **Teste diese User-Flows**:
   - ✅ Neue Journey Map erstellen
   - ✅ Timeline mit mehreren Stories (inkl. Duplikate)
   - ✅ AI-generierte Stages
   - ✅ Journey Map bearbeiten
   - ✅ Journey Map löschen

## Was hat sich geändert?

### Vorher (Alt)
```typescript
interface UserJourneyMap {
  user_story_ids: string[]  // Simple Array
}
```

### Nachher (Neu)
```typescript
interface UserJourneyMap {
  ai_optimize_timeline: boolean
  // timeline wird über separate Tabelle verwaltet
}

interface UserJourneyMapTimeline {
  journey_map_id: string
  user_story_id: string
  position: number  // Ermöglicht exakte Reihenfolge + Duplikate
}
```

## API-Beispiele

### Journey Map erstellen
```typescript
POST /api/projects/{projectId}/user-journey-maps
{
  "title": "Checkout Journey",
  "persona_id": "uuid...",
  "timeline": ["story1", "story2", "story1"],  // story1 kommt 2x vor!
  "ai_optimize_timeline": true,
  "stages": [...]
}
```

### Journey Map abrufen
```typescript
GET /api/projects/{projectId}/user-journey-maps/{mapId}

Response:
{
  ...journeyMap,
  "timeline": [
    { "journey_map_id": "...", "user_story_id": "story1", "position": 0 },
    { "journey_map_id": "...", "user_story_id": "story2", "position": 1 },
    { "journey_map_id": "...", "user_story_id": "story1", "position": 2 }
  ]
}
```

## Nächste Schritte

1. ✅ Migration in Supabase ausführen
2. ✅ App starten und testen
3. 🔄 Falls Probleme: Rollback ausführen und Debug
4. ✅ Wenn alles funktioniert: LocalStorage-Hook kann entfernt werden

## Fragen?

Bei Problemen:
1. Prüfe Supabase Logs
2. Prüfe Browser Console
3. Prüfe Network Tab (API calls)
4. Falls nötig: Rollback ausführen
---
description: How to add a new page to the Next.js frontend
---

# Add a New Frontend Page

## Architecture Overview

The frontend uses **Next.js 14 App Router** with these key directories:
```
src/app/          — Pages (file-based routing)
src/components/   — Reusable components
src/lib/api.ts    — API client (all backend calls)
src/lib/utils.ts  — Utility functions
src/store/        — Zustand state management
```

## 1. Add the API Call

Edit `frontend/src/lib/api.ts` and add your API function:

```typescript
export async function getYourData(token: string) {
  const res = await fetch(`${API_URL}/your-endpoint`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}
```

## 2. Create the Page

### Admin Page
Create `frontend/src/app/admin/your-page/page.tsx`

### Campus Page (logged-in user)
Create `frontend/src/app/campus/your-page/page.tsx`

### Public Page
Create `frontend/src/app/your-page/page.tsx`

Example page structure:

```tsx
"use client";
import { useEffect, useState } from "react";
import { getYourData } from "@/lib/api";

export default function YourPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getYourData(token).then(setData);
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Page</h1>
      {/* Your UI here */}
    </div>
  );
}
```

## 3. Add Navigation (if needed)

### Admin Sidebar
Edit `frontend/src/components/admin/AdminLayout.tsx` to add a sidebar link.

### Campus Navigation
Edit `frontend/src/app/campus/layout.tsx` to add navigation.

## 4. Add UI Components (if needed)

Create reusable components in `frontend/src/components/ui/` or feature-specific components in `frontend/src/components/your-feature/`.

## 5. Style with TailwindCSS

- Use existing design tokens from `frontend/tailwind.config.js`
- Global styles are in `frontend/src/app/globals.css`
- Use `clsx` and `tailwind-merge` for conditional classes

## 6. Verify

// turbo
```bash
cd c:\projects\school-website\frontend
npm run type-check
npm run lint
npm run build
```

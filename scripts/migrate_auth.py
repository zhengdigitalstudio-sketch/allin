#!/usr/bin/env python3
"""
Replace getServerSession(authOptions) pattern with getSession(request) in all API routes.
Also replaces session.user as any patterns with direct session properties.
"""
import re, os, glob

# Find all route.ts files in src/app/api (excluding new auth routes)
files = glob.glob('/home/z/my-project/src/app/api/**/route.ts', recursive=True)
skip_dirs = ['/api/auth/login/', '/api/auth/logout/', '/api/auth/me/', '/api/auth/[...nextauth]']
files = [f for f in files if not any(d in f for d in skip_dirs)]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Replace imports: remove next-auth imports
    content = re.sub(r"import \{ getServerSession \} from 'next-auth'\n", '', content)
    content = re.sub(r"import \{ authOptions \} from '@/lib/auth'\n", '', content)
    
    # Add new import at top (after 'use server' or at beginning)
    if "from '@/lib/auth'" not in content:
        # Find first import line and add before it
        lines = content.split('\n')
        insert_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                insert_idx = i
                break
        if "import { NextRequest" in content or "import { NextResponse" in content:
            lines.insert(insert_idx, "import { getSession, PENGURUS_ROLES, APPROVER_ROLES, ARTICLE_CREATE_ROLES } from '@/lib/auth'")
        else:
            lines.insert(insert_idx, "import { getSession, PENGURUS_ROLES, APPROVER_ROLES, ARTICLE_CREATE_ROLES } from '@/lib/auth'")
        content = '\n'.join(lines)
    
    # Replace: const session = await getServerSession(authOptions)
    content = re.sub(
        r"const session = await getServerSession\(authOptions\)",
        "const session = await getSession(request)",
        content
    )
    # Also handle cases with NextRequest in params
    content = re.sub(
        r"const session = await getServerSession\(authOptions\)\s*\n",
        "const session = await getSession(request)\n",
        content
    )
    
    # Replace: (session.user as any).role with session?.role
    content = re.sub(r'\(session\.user as any\)\.role as string', "session?.role || ''", content)
    content = re.sub(r'\(session\.user as any\)\.role\)', "session?.role || ''", content)
    
    # Replace: (session.user as any).id with session?.id
    content = re.sub(r'\(session\.user as any\)\.id as string', "session?.id || ''", content)
    content = re.sub(r'\(session\.user as any\)\.id\)', "session?.id || ''", content)
    
    # Remove local PENGURUS_ROLES definitions if they exist (we import from auth.ts now)
    # Only remove if it matches our standard definition
    content = re.sub(
        r"const PENGURUS_ROLES = \['SUPER_ADMIN', 'KETUA', 'WAKIL_KETUA', 'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA'\]\n",
        '',
        content
    )
    
    # Remove AGENDA_CREATE_ROLES if present
    content = re.sub(
        r"const AGENDA_CREATE_ROLES = \['SUPER_ADMIN', 'KETUA', 'SEKRETARIS'\]\n",
        '',
        content
    )
    
    # Replace AGENDA_CREATE_ROLES usage with APPROVER_ROLES
    content = content.replace('AGENDA_CREATE_ROLES', 'APPROVER_ROLES')
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated: {filepath}")
    else:
        print(f"No changes: {filepath}")

print("\nDone!")
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

/**
 * Triggers a native browser file download that saves the file into the user's
 * File Explorer (Downloads folder).
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  // 1. IE / Legacy Edge support
  if (typeof (window.navigator as any).msSaveOrOpenBlob === 'function') {
    (window.navigator as any).msSaveOrOpenBlob(blob, filename);
    return;
  }

  // 2. Standard HTML5 blob download
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.position = 'fixed';
  anchor.style.top = '-9999px';
  anchor.style.left = '-9999px';
  anchor.style.opacity = '0';
  anchor.href = url;
  anchor.download = filename;
  anchor.setAttribute('download', filename);
  anchor.setAttribute('rel', 'noopener noreferrer');

  document.body.appendChild(anchor);

  try {
    anchor.click();
  } catch (err) {
    // Synthetic event dispatch fallback
    const clickEvt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    anchor.dispatchEvent(clickEvt);
  }

  // Keep URL alive long enough for disk persistence before revoking
  setTimeout(() => {
    try {
      if (document.body.contains(anchor)) {
        document.body.removeChild(anchor);
      }
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Ignored cleanup errors
    }
  }, 10000);
}

/**
 * 1. Generates and downloads the n8n Workflow Blueprint JSON Specification.
 */
export async function downloadN8nWorkflowBlueprint(workshopTitle = 'AI Agents with n8n & Gemini') {
  const workflowData = {
    name: `S-CODERS • ${workshopTitle} • Production Workflow`,
    version: '1.4.0',
    createdAt: new Date().toISOString(),
    author: 'S-CODERS (Bharat Tech Developers) - Bengaluru',
    license: 'MIT',
    meta: {
      templateCredsSetupCompleted: true,
      instanceId: 'scoders_enterprise_cluster_01'
    },
    nodes: [
      {
        parameters: {
          httpMethod: 'POST',
          path: 'webhook/v1/ai-agent-trigger',
          responseMode: 'responseNode',
          options: {}
        },
        name: 'Incoming Webhook Trigger',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1.1,
        position: [240, 300],
        id: 'node-webhook-01'
      },
      {
        parameters: {
          model: 'models/gemini-2.5-flash',
          options: {
            temperature: 0.2,
            maxOutputTokens: 2048
          }
        },
        name: 'Google Gemini 2.5 Flash Model',
        type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
        typeVersion: 1,
        position: [460, 480],
        id: 'node-gemini-lm-02'
      },
      {
        parameters: {
          promptType: 'define',
          text: '=Analyze the client request payload: {{ $json.body.query }}\nIdentify intent and extract entities into JSON schema.',
          hasOutputParser: true
        },
        name: 'AI Agent Reasoning Engine',
        type: '@n8n/n8n-nodes-langchain.agent',
        typeVersion: 1.6,
        position: [500, 300],
        id: 'node-agent-core-03'
      },
      {
        parameters: {
          tableName: 'developer_knowledge_base',
          similarityMetric: 'cosine'
        },
        name: 'Supabase Vector Memory RAG',
        type: '@n8n/n8n-nodes-langchain.vectorStoreSupabase',
        typeVersion: 1,
        position: [700, 480],
        id: 'node-vector-rag-04'
      },
      {
        parameters: {
          options: {
            responseCode: 200
          }
        },
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1.1,
        position: [780, 300],
        id: 'node-respond-05'
      }
    ],
    connections: {
      'Incoming Webhook Trigger': {
        main: [
          [
            {
              node: 'AI Agent Reasoning Engine',
              type: 'main',
              index: 0
            }
          ]
        ]
      },
      'Google Gemini 2.5 Flash Model': {
        ai_languageModel: [
          [
            {
              node: 'AI Agent Reasoning Engine',
              type: 'ai_languageModel',
              index: 0
            }
          ]
        ]
      },
      'Supabase Vector Memory RAG': {
        ai_tool: [
          [
            {
              node: 'AI Agent Reasoning Engine',
              type: 'ai_tool',
              index: 0
            }
          ]
        ]
      },
      'AI Agent Reasoning Engine': {
        main: [
          [
            {
              node: 'Respond to Webhook',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    },
    settings: {
      executionOrder: 'v1'
    }
  };

  const jsonStr = JSON.stringify(workflowData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  triggerFileDownload(blob, 'n8n_ai_workflow_blueprints_scoders.json');
}

/**
 * 2. Generates and downloads the Gemini System Prompts Cheat-sheet PDF.
 */
export async function downloadGeminiSystemPromptsPdf() {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 50;

  // Header Banner
  doc.setFillColor(11, 15, 23); // #0B0F17
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setTextColor(34, 211, 238); // #22D3EE (Brand Teal)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('S-CODERS • BHARAT TECH DEVELOPERS', margin, 42);

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Gemini 2.5 & AI Agent System Prompt Engineering Guide', margin, 65);

  y = 120;

  // Title Section
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('1. Core Principles of Autonomous AI System Prompts', margin, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const introText = 
    'When building production multi-agent systems with Google Gemini 2.5 Flash and Pro models, ' +
    'system instructions must enforce identity, operational boundaries, tool availability, and structured output formatting. ' +
    'Below are the exact production templates used by S-CODERS engineering leads in Bengaluru.';
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 14 + 15;

  // Template Box 1: Coding Agent
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 140, 6, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 140, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('TEMPLATE A: Senior Autonomous Software Engineer (TypeScript & React)', margin + 12, y + 20);

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const promptCode1 = [
    'You are a senior full-stack software engineer at Bharat Tech Developers.',
    'Your goal is to build robust, bug-free, and high-performance TypeScript components.',
    '- Adhere strictly to Tailwind CSS utility conventions. Never use inline styles.',
    '- When generating APIs, return clean JSON without markdown conversational filler.',
    '- Always handle edge cases: network timeout, null pointer, and token expiry.',
    '- Temperature: 0.15 | TopP: 0.95 | Model: gemini-2.5-flash'
  ];
  doc.text(promptCode1, margin + 12, y + 40);
  y += 160;

  // Template Box 2: Tool Calling & Function Declaration
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 140, 6, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 140, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('TEMPLATE B: Multi-Step Tool Calling & ReAct Execution Loop', margin + 12, y + 20);

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const promptCode2 = [
    'You are an orchestrator agent that has access to tools: [search_db, run_code, send_webhook].',
    'Follow this strict loop for every user query:',
    '1. THOUGHT: State internal reasoning clearly before acting.',
    '2. ACTION: Call the appropriate function with required arguments schema.',
    '3. OBSERVATION: Inspect function return value.',
    '4. FINAL ANSWER: Formulate output response to the user with references.'
  ];
  doc.text(promptCode2, margin + 12, y + 40);
  y += 160;

  // Template Box 3: Production Constraints
  doc.setFillColor(240, 253, 250); // Teal tint
  doc.roundedRect(margin, y, contentWidth, 120, 6, 6, 'F');
  doc.setDrawColor(45, 212, 191);
  doc.roundedRect(margin, y, contentWidth, 120, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 148, 136);
  doc.text('KEY BEST PRACTICES FROM SHREYAS M. & LOKESH A.', margin + 12, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const tips = [
    '1. Never prompt the model to "be smart" — instead define precise role boundaries.',
    '2. Use systemInstruction in GoogleGenAI SDK instead of injecting into user history.',
    '3. Enable responseSchema with Type.OBJECT to guarantee zero syntax parse errors.',
    '4. Store conversation session history in Redis or PostgreSQL with user token keys.'
  ];
  doc.text(tips, margin + 12, y + 42);

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Verified Asset • S-CODERS Tech Conference & Workshop Series • scoders82@gmail.com', margin, 800);

  const pdfBlob = doc.output('blob');
  triggerFileDownload(pdfBlob, 'gemini_system_prompts_cheatsheet.pdf');
}

/**
 * 3. Generates and downloads the real SaaS Multitenant Boilerplate ZIP archive.
 */
export async function downloadSaasBoilerplateZip() {
  const zip = new JSZip();

  // 1. README.md
  zip.file(
    'README.md',
    `# S-CODERS SaaS Multitenant Production Boilerplate
Developed by S-CODERS (Bharat Tech Developers) • Bengaluru, India

## Overview
This production starter template implements complete multi-tenant tenant isolation with:
- Tenant-specific subdomain / path resolution
- PostgreSQL Row Level Security (RLS) policies
- Role-Based Access Control (Admin, Member, Viewer)
- React 19 + TypeScript frontend with Tailwind CSS
- Express.js API backend with JWT tenant session verification

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`

## Project Structure
- \`/src/components/TenantDashboard.tsx\`: Tenant dashboard & metrics
- \`/src/components/OrgSwitcher.tsx\`: Interactive organization switcher
- \`/src/server/tenantIsolation.ts\`: Express middleware for tenant resolution
- \`/src/server/rlsPolicies.sql\`: Supabase/PostgreSQL RLS migration script
- \`/src/types/index.ts\`: Common TypeScript interfaces

## Support
Contact: scoders82@gmail.com | Phone: +91 6363905989
`
  );

  // 2. package.json
  zip.file(
    'package.json',
    JSON.stringify(
      {
        name: 'scoders-saas-multitenant-starter',
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          serve: 'node server.js'
        },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          'lucide-react': '^0.546.0',
          clsx: '^2.1.1',
          'tailwind-merge': '^3.0.0'
        },
        devDependencies: {
          vite: '^6.2.0',
          typescript: '^5.8.0',
          tailwindcss: '^4.0.0'
        }
      },
      null,
      2
    )
  );

  // 3. tsconfig.json
  zip.file(
    'tsconfig.json',
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ESNext',
          useDefineForClassFields: true,
          lib: ['DOM', 'DOM.Iterable', 'ESNext'],
          allowJs: false,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          module: 'ESNext',
          moduleResolution: 'Node',
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx'
        },
        include: ['src']
      },
      null,
      2
    )
  );

  // 4. Source Files
  const src = zip.folder('src');
  if (src) {
    src.file(
      'main.tsx',
      `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
    );

    src.file(
      'App.tsx',
      `import React, { useState } from 'react';
import { TenantDashboard } from './components/TenantDashboard';
import { OrgSwitcher } from './components/OrgSwitcher';

export default function App() {
  const [currentTenant, setCurrentTenant] = useState({
    id: 'org_scoders_01',
    name: 'Bharat Tech Innovators',
    plan: 'Enterprise',
    membersCount: 14
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="max-w-6xl mx-auto flex justify-between items-center pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-cyan-400">S-CODERS SaaS Engine</h1>
          <p className="text-xs text-slate-400">Multitenant Isolation Architecture</p>
        </div>
        <OrgSwitcher currentTenant={currentTenant} onSelectTenant={setCurrentTenant} />
      </header>

      <main className="max-w-6xl mx-auto pt-8">
        <TenantDashboard tenant={currentTenant} />
      </main>
    </div>
  );
}`
    );

    src.file(
      'index.css',
      `@import "tailwindcss";

body {
  margin: 0;
  background-color: #030712;
  color: #f9fafb;
}`
    );

    const components = src.folder('components');
    if (components) {
      components.file(
        'TenantDashboard.tsx',
        `import React from 'react';

export function TenantDashboard({ tenant }: { tenant: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-2">Tenant Workspace: {tenant.name}</h2>
        <p className="text-xs text-slate-400">Tenant ID: <code className="text-cyan-400">{tenant.id}</code></p>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 uppercase font-mono">Subscription Plan</span>
            <p className="text-xl font-bold text-white mt-1">{tenant.plan}</p>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 uppercase font-mono">Active Members</span>
            <p className="text-xl font-bold text-white mt-1">{tenant.membersCount}</p>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 uppercase font-mono">Data Isolation Status</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">RLS Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}`
      );

      components.file(
        'OrgSwitcher.tsx',
        `import React from 'react';

export function OrgSwitcher({ currentTenant, onSelectTenant }: any) {
  const tenants = [
    { id: 'org_scoders_01', name: 'Bharat Tech Innovators', plan: 'Enterprise', membersCount: 14 },
    { id: 'org_acme_corp', name: 'Acme Cloud Labs', plan: 'Pro', membersCount: 5 },
    { id: 'org_dev_sandbox', name: 'Developer Sandbox', plan: 'Starter', membersCount: 2 }
  ];

  return (
    <select
      value={currentTenant.id}
      onChange={(e) => {
        const found = tenants.find(t => t.id === e.target.value);
        if (found) onSelectTenant(found);
      }}
      className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono outline-none cursor-pointer"
    >
      {tenants.map(t => (
        <option key={t.id} value={t.id}>🏢 {t.name} ({t.plan})</option>
      ))}
    </select>
  );
}`
      );
    }

    const serverFolder = src.folder('server');
    if (serverFolder) {
      serverFolder.file(
        'tenantIsolation.ts',
        `// Express Middleware for Multitenant Tenant Context Extraction
import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
  tenantRole?: string;
}

export function tenantIsolationMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  // 1. Resolve tenant via Header or Subdomain
  const headerTenant = req.headers['x-tenant-id'] as string;
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];

  const tenantId = headerTenant || (subdomain !== 'www' && subdomain !== 'app' ? subdomain : 'default_tenant');

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant context resolution failed. Unauthorized organization access.' });
  }

  req.tenantId = tenantId;
  res.setHeader('X-Resolved-Tenant', tenantId);
  next();
}`
      );

      serverFolder.file(
        'rlsPolicies.sql',
        `-- PostgreSQL / Supabase Row-Level Security (RLS) for Multi-Tenancy
-- Developed by S-CODERS • Bharat Tech Developers

-- 1. Enable RLS on core tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Tenant isolation policy for projects table
CREATE POLICY tenant_isolation_projects ON projects
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

-- 3. Tenant isolation policy for documents table
CREATE POLICY tenant_isolation_documents ON documents
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

-- 4. Session helper function to bind tenant per connection
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`
      );
    }
  }

  const zipContent = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(zipContent, 'saas_multitenant_boilerplate.zip');
}

/**
 * 4. Generates and downloads the Session Deck & Exercises Presentation Guide PDF.
 */
export async function downloadSessionDeckExercisesPdf(workshopTitle = 'AI Agents with n8n & Gemini') {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 50;

  // Header Banner
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setTextColor(34, 211, 238);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('S-CODERS • WORKSHOP SESSION DECK', margin, 42);

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Official Curriculum, Architecture Slides & Lab Exercises • ${workshopTitle}`, margin, 65);

  y = 120;

  // Slide 1
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 120, 6, 6, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 120, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('SLIDE 1: Modern AI Agent Architecture Overview', margin + 14, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const slide1Lines = [
    '• Foundation Models vs. Autonomous Agent Loops: Understanding the ReAct loop.',
    '• Tool Definitions: Schemas, function parameters, and deterministic execution boundaries.',
    '• Memory Layers: Ephemeral session context vs. persistent vector embeddings (Supabase/PostgreSQL).',
    '• Latency Optimizations: Streaming token deltas directly to client UI via Server-Sent Events (SSE).'
  ];
  doc.text(slide1Lines, margin + 14, y + 46);
  y += 140;

  // Slide 2: Hands-on Lab Exercises
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 160, 6, 6, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 160, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('HANDS-ON LAB EXERCISES (Required for Certificate Eligibility)', margin + 14, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const labLines = [
    'Exercise 1: Create an n8n webhook listener that ingests incoming JSON payloads and logs to terminal.',
    'Exercise 2: Connect the Google Gemini 2.5 Flash model with system instructions to classify sentiment.',
    'Exercise 3: Implement tool routing: if query asks for database data, trigger query_sql; else reply directly.',
    'Exercise 4: Store conversation memory in localStorage and sync with the S-CODERS Sandbox environment.',
    'Exercise 5: Deploy the complete agent to Google Cloud Run or Render with environment secrets.'
  ];
  doc.text(labLines, margin + 14, y + 46);
  y += 180;

  // Slide 3: Certificate Milestone & Verification
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(margin, y, contentWidth, 110, 6, 6, 'F');
  doc.setDrawColor(45, 212, 191);
  doc.roundedRect(margin, y, contentWidth, 110, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(13, 148, 136);
  doc.text('OFFICIAL MENTOR VERIFICATION & CREDENTIAL MINTING', margin + 14, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const certLines = [
    'Upon completing the exercises, submit your pass key and repository link to your instructor.',
    'Verification Mentors: Shreyas M. (Founder), Lokesh A. (Co-Founder), Bhuvan M. (Tech Lead).',
    'Official S-CODERS Digital Developer Credentials are dispatched via scoders82@gmail.com.'
  ];
  doc.text(certLines, margin + 14, y + 44);

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('© 2026 S-CODERS (Bharat Tech Developers) • Bengaluru, India • All Rights Reserved', margin, 800);

  const pdfBlob = doc.output('blob');
  triggerFileDownload(pdfBlob, 'scoders_workshop_session_deck_exercises.pdf');
}

/**
 * 5. Generates and downloads real client spec PDFs for Services section.
 */
export async function downloadServiceSpecPdf(filename: string, desc: string) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 50;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setTextColor(34, 211, 238);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('S-CODERS • SPECIFICATION DOCUMENT', margin, 42);

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Official Technical Deliverable: ${filename.replace('.pdf', '')}`, margin, 65);

  y = 120;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Document Overview & Scope', margin, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const p1 = `This document contains the verified architectural specifications, implementation plans, and engineering parameters prepared by S-CODERS (Bharat Tech Developers) for your project: "${desc}".`;
  const p1Lines = doc.splitTextToSize(p1, contentWidth);
  doc.text(p1Lines, margin, y);
  y += p1Lines.length * 14 + 20;

  // Section 1: Architecture Highlights
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 130, 6, 6, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 130, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Architectural & Technology Highlights', margin + 12, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const items = [
    '• Frontend Stack: React 19, TypeScript 5.8, Tailwind CSS v4, Motion engine.',
    '• Backend & Proxy: Express.js server, Node.js v20+ runtime, encrypted payload transport.',
    '• AI Core: Google Gemini 2.5 Flash / Pro API with structured output schemas.',
    '• Database & State: PostgreSQL / SQLite with Row-Level Security and strict tenant boundary isolation.',
    '• Deployment Target: Google Cloud Run containerized deployment with custom domain routing.'
  ];
  doc.text(items, margin + 12, y + 40);
  y += 150;

  // Section 2: Milestones & Lead Engineers
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(margin, y, contentWidth, 120, 6, 6, 'F');
  doc.setDrawColor(45, 212, 191);
  doc.roundedRect(margin, y, contentWidth, 120, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 148, 136);
  doc.text('2. Engineering Team Assignment & Coordination', margin + 12, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const teamItems = [
    '• Shreyas M. (Founder & CEO): Lead Architecture, System Design & Model Routing.',
    '• Lokesh A. (Co-Founder): Vibe Coding Prototyping, Prompt Engineering & Workflow Automations.',
    '• Bhuvan M. (Tech Lead): UI/UX Platform Development & Full-Stack Implementation.',
    '• Direct Support: scoders82@gmail.com | WhatsApp: +91 6363905989'
  ];
  doc.text(teamItems, margin + 12, y + 40);

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('S-CODERS (Bharat Tech Developers) • Confidential Technical Asset • Bengaluru, India', margin, 800);

  const pdfBlob = doc.output('blob');
  triggerFileDownload(pdfBlob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

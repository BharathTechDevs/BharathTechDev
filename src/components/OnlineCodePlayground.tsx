import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Download,
  Trash2,
  Maximize2,
  Minimize2,
  Terminal,
  Eye,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Monitor,
  Smartphone,
  Tablet,
  Code2,
  ChevronDown,
  Square,
  History,
  FileCode,
  Plus,
  X,
  Wand2,
  BookOpen,
  ShieldAlert,
  Search,
  Package,
  Layers,
  Settings,
  RefreshCw,
  ExternalLink,
  Sliders,
  CheckCheck,
  CornerDownLeft,
  Send
} from 'lucide-react';

export type SupportedLanguage =
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'react'
  | 'html'
  | 'javascript'
  | 'typescript'
  | 'sql'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'php'
  | 'ruby'
  | 'bash';

export interface LanguageOption {
  id: SupportedLanguage;
  name: string;
  extension: string;
  category: 'compiled' | 'interpreted' | 'web' | 'systems';
  hasLiveUI: boolean;
  versionLabel: string;
  badgeColor: string;
  libraries: string[];
}

export const LANGUAGES: LanguageOption[] = [
  {
    id: 'python',
    name: 'Python 3',
    extension: 'py',
    category: 'interpreted',
    hasLiveUI: false,
    versionLabel: 'Python 3.10.12 (NumPy, Pandas, Matplotlib)',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    libraries: ['numpy', 'pandas', 'matplotlib.pyplot', 'scipy', 'requests', 'math', 'sys', 'os', 'json', 'random', 'datetime', 're']
  },
  {
    id: 'java',
    name: 'Java (OpenJDK)',
    extension: 'java',
    category: 'compiled',
    hasLiveUI: false,
    versionLabel: 'OpenJDK 17 / 22 (LTS HotSpot)',
    badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    libraries: ['java.util.*', 'java.util.stream.*', 'java.io.*', 'java.math.*', 'java.time.*', 'java.nio.*', 'java.net.*']
  },
  {
    id: 'cpp',
    name: 'C++ (GNU G++)',
    extension: 'cpp',
    category: 'compiled',
    hasLiveUI: false,
    versionLabel: 'GNU G++ 12 / 13 (C++20 Standard)',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    libraries: ['<iostream>', '<vector>', '<string>', '<algorithm>', '<map>', '<set>', '<queue>', '<cmath>', '<numeric>', '<memory>', '<ranges>']
  },
  {
    id: 'c',
    name: 'C (GNU GCC)',
    extension: 'c',
    category: 'compiled',
    hasLiveUI: false,
    versionLabel: 'GNU GCC 12 / 13 (C17 Standard)',
    badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    libraries: ['<stdio.h>', '<stdlib.h>', '<string.h>', '<math.h>', '<stdbool.h>', '<time.h>', '<ctype.h>', '<limits.h>']
  },
  {
    id: 'react',
    name: 'React 19 (JSX)',
    extension: 'jsx',
    category: 'web',
    hasLiveUI: true,
    versionLabel: 'React 19 + Babel + Tailwind Live Engine',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    libraries: ['React 19 Hooks', 'ReactDOM', 'Babel Standalone', 'Tailwind CSS v4', 'Lucide Icons', 'HTML5 Canvas']
  },
  {
    id: 'html',
    name: 'HTML5 & CSS3 & JS',
    extension: 'html',
    category: 'web',
    hasLiveUI: true,
    versionLabel: 'Modern Web Standards Engine',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    libraries: ['HTML5 Semantic Elements', 'CSS3 Flexbox / Grid', 'Tailwind CSS', 'ES6+ JavaScript API', 'DOM APIs', 'Canvas']
  },
  {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    extension: 'js',
    category: 'interpreted',
    hasLiveUI: false,
    versionLabel: 'Node.js v22 (V8 Engine)',
    badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    libraries: ['crypto', 'path', 'fs', 'os', 'util', 'events', 'buffer', 'stream', 'url', 'perf_hooks']
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extension: 'ts',
    category: 'interpreted',
    hasLiveUI: false,
    versionLabel: 'TypeScript 5.8 (esbuild compiler)',
    badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    libraries: ['Type System', 'Interfaces', 'Generics', 'Enums', 'Node.js Standard API']
  },
  {
    id: 'sql',
    name: 'SQL (SQLite 3)',
    extension: 'sql',
    category: 'interpreted',
    hasLiveUI: false,
    versionLabel: 'SQLite 3 (In-Memory Relational Engine)',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    libraries: ['DDL (CREATE, ALTER, DROP)', 'DML (INSERT, UPDATE, DELETE)', 'Queries (SELECT, JOIN, GROUP BY, WINDOW FUNCTIONS)']
  },
  {
    id: 'csharp',
    name: 'C# (.NET 8)',
    extension: 'cs',
    category: 'compiled',
    hasLiveUI: false,
    versionLabel: '.NET 8 / Mono Runtime',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    libraries: ['System', 'System.Collections.Generic', 'System.Linq', 'System.Text', 'System.Threading.Tasks', 'System.IO']
  },
  {
    id: 'go',
    name: 'Go (Golang)',
    extension: 'go',
    category: 'systems',
    hasLiveUI: false,
    versionLabel: 'Go 1.22 / 1.23 Engine',
    badgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    libraries: ['fmt', 'strings', 'math', 'time', 'sync', 'sort', 'os', 'io', 'bufio', 'net/http']
  },
  {
    id: 'rust',
    name: 'Rust (Rustc)',
    extension: 'rs',
    category: 'systems',
    hasLiveUI: false,
    versionLabel: 'Rust 1.82 (Rustc + Cargo)',
    badgeColor: 'text-amber-600 bg-amber-600/10 border-amber-600/30',
    libraries: ['std::vec::Vec', 'std::collections::HashMap', 'std::io', 'std::time', 'std::fmt', 'std::fs']
  },
  {
    id: 'php',
    name: 'PHP 8',
    extension: 'php',
    category: 'interpreted',
    hasLiveUI: false,
    versionLabel: 'PHP 8.2 / 8.3 CLI',
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    libraries: ['Standard Array Functions', 'String Handling', 'Math', 'JSON', 'Date & Time', 'Regex (PCRE)']
  },
  {
    id: 'ruby',
    name: 'Ruby 3',
    extension: 'rb',
    category: 'interpreted',
    hasLiveUI: false,
    versionLabel: 'Ruby 3.1 / 3.3 Engine',
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/30',
    libraries: ['Enumerable', 'Math', 'Time', 'JSON', 'Digest', 'Regexp', 'File', 'Dir']
  },
  {
    id: 'bash',
    name: 'Bash Shell',
    extension: 'sh',
    category: 'systems',
    hasLiveUI: false,
    versionLabel: 'GNU Bash 5.2',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    libraries: ['Coreutils', 'grep', 'awk', 'sed', 'cut', 'sort', 'find', 'curl', 'uname']
  }
];

export const STARTER_TEMPLATES: Record<SupportedLanguage, string> = {
  python: `# S-CODERS Universal Python Playground
# Built-in: NumPy, Pandas, Matplotlib, SciPy & Standard Libraries
import numpy as np
import pandas as pd
import math
import sys

print("⚡ Welcome to S-CODERS Universal Python Playground!")
print(f"Python Runtime: {sys.version.split()[0]}")

# 1. NumPy Array Operations
arr = np.array([12, 24, 36, 48, 60, 72, 84, 96])
print(f"NumPy Mean: {np.mean(arr):.2f} | Standard Dev: {np.std(arr):.2f}")

# 2. Pandas DataFrame Operations
data = {
    "Engineer": ["Shreyas", "Bharat", "Ananya", "Rahul"],
    "Department": ["AI Systems", "Cloud Infra", "Full Stack", "Data Science"],
    "Velocity_Score": [98, 96, 94, 99]
}
df = pd.DataFrame(data)
print("\\n--- S-CODERS Engineering Roster (Pandas) ---")
print(df.to_string(index=False))

# Try pasting any Python program or data analysis script!
`,

  java: `// S-CODERS Java OpenJDK Execution Engine
// OpenJDK 17 LTS / OpenJDK 22 with full standard library
import java.util.*;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        System.out.println("⚡ Hello from S-CODERS Java Universal Execution Engine!");
        System.out.println("Java Vendor: " + System.getProperty("java.vendor"));
        System.out.println("Java Version: " + System.getProperty("java.version"));

        // 1. Collections & Streams API
        List<String> technologies = Arrays.asList("Java OpenJDK", "Python", "C++", "React", "TypeScript", "Go", "Rust");
        System.out.println("\\nSupported Runtimes Count: " + technologies.size());

        List<String> upperList = technologies.stream()
                .map(String::toUpperCase)
                .sorted()
                .collect(Collectors.toList());

        System.out.println("Sorted Runtimes:");
        upperList.forEach(tech -> System.out.println("  • " + tech));

        // 2. Mathematical Algorithm
        int n = 10;
        System.out.println("\\nFactorial of " + n + " = " + calculateFactorial(n));
    }

    public static long calculateFactorial(int n) {
        long result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
}
`,

  cpp: `// S-CODERS C++ Compiler Engine (GNU G++ C++20)
// Complete C++ Standard Template Library (STL)
#include <iostream>
#include <vector>
#include <string>
#include <numeric>
#include <algorithm>
#include <iomanip>

int main() {
    std::cout << "⚡ S-CODERS C++20 Universal Compiler" << std::endl;
    std::cout << "Compiling with GNU G++ Optimizations (-O2)" << std::endl;

    // 1. Vector & Algorithms
    std::vector<int> scores = {88, 94, 91, 99, 85, 96, 100};
    std::sort(scores.begin(), scores.end(), std::greater<int>());

    int totalSum = std::accumulate(scores.begin(), scores.end(), 0);
    double average = static_cast<double>(totalSum) / scores.size();

    std::cout << "\\nTop Engineering Metrics (Sorted Descending):" << std::endl;
    for (int score : scores) {
        std::cout << "  [Score]: " << score << "%" << std::endl;
    }

    std::cout << std::fixed << std::setprecision(2);
    std::cout << "\\nTotal Metrics Count : " << scores.size() << std::endl;
    std::cout << "Average Score        : " << average << "%" << std::endl;
    std::cout << "Peak Performance     : " << scores.front() << "%" << std::endl;

    return 0;
}
`,

  c: `// S-CODERS C Compiler Engine (GNU GCC C17)
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[32];
    int score;
    char tier[16];
} Developer;

int main() {
    printf("⚡ S-CODERS High-Performance C Engine\\n");
    printf("Standards: C17 (GNU GCC)\\n\\n");

    Developer team[3] = {
        {"Lead Architect", 99, "Legendary"},
        {"Systems Engineer", 95, "Master"},
        {"Compiler Specialist", 98, "Grandmaster"}
    };

    printf("%-22s | %-6s | %-12s\\n", "Role", "Score", "Tier");
    printf("--------------------------------------------\\n");

    for (int i = 0; i < 3; i++) {
        printf("%-22s | %-6d | %-12s\\n", team[i].name, team[i].score, team[i].tier);
    }

    printf("\\nMemory allocated and verified successfully.\\n");
    return 0;
}
`,

  react: `// S-CODERS React 19 Interactive Live Component
// Runs live in real-time with Interactive UI Preview!

function UniversalCalculator() {
  const [display, setDisplay] = React.useState('0');
  const [equation, setEquation] = React.useState('');
  const [history, setHistory] = React.useState([]);

  const handleDigit = (val) => {
    setDisplay(prev => prev === '0' ? val : prev + val);
  };

  const handleOp = (op) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleEquals = () => {
    try {
      const full = equation + display;
      const sanitized = full.replace(/×/g, '*').replace(/÷/g, '/');
      const res = Function('"use strict"; return (' + sanitized + ')')();
      const resStr = String(res);
      setHistory(prev => [full + ' = ' + resStr, ...prev.slice(0, 4)]);
      setDisplay(resStr);
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  return (
    <div style={{
      maxWidth: '420px',
      margin: '20px auto',
      background: '#0B0F17',
      borderRadius: '24px',
      border: '1px solid #1E293B',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22D3EE' }}></span>
          <span style={{ fontSize: '12px', letterSpacing: '1.5px', color: '#22D3EE', fontWeight: '800' }}>S-CODERS CALC</span>
        </div>
        <span style={{ fontSize: '10px', background: 'rgba(34,211,238,0.15)', color: '#22D3EE', padding: '3px 10px', borderRadius: '999px', border: '1px solid rgba(34,211,238,0.3)' }}>REACT 19 LIVE</span>
      </div>

      <div style={{
        background: '#030712',
        border: '1px solid #1E293B',
        borderRadius: '16px',
        padding: '16px',
        textAlign: 'right',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '12px', color: '#64748B', height: '18px', fontFamily: 'monospace' }}>{equation || 'Ready'}</div>
        <div style={{ fontSize: '38px', fontWeight: 'bold', color: '#F8FAFC', overflow: 'hidden', fontFamily: 'monospace' }}>{display}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map((btn, i) => {
          const isOp = ['÷', '×', '-', '+', '='].includes(btn);
          const isC = btn === 'C';
          return (
            <button
              key={i}
              onClick={() => {
                if (btn === 'C') handleClear();
                else if (btn === '=') handleEquals();
                else if (isOp) handleOp(btn);
                else handleDigit(btn);
              }}
              style={{
                padding: '16px 0',
                borderRadius: '12px',
                border: 'none',
                background: isC ? '#EF4444' : isOp ? '#22D3EE' : '#1E293B',
                color: isOp ? '#0B0F17' : '#FFFFFF',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                gridColumn: btn === '=' ? 'span 2' : 'span 1',
                transition: 'all 0.15s'
              }}
            >
              {btn}
            </button>
          );
        })}
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #1E293B', paddingTop: '12px' }}>
          <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Calculations:</span>
          <div style={{ marginTop: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#94A3B8' }}>
            {history.map((h, idx) => (
              <div key={idx} style={{ padding: '2px 0' }}>{h}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<UniversalCalculator />);
`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>S-CODERS Web Playground</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0B0F17;
      color: #E2E8F0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #131A29;
      border: 1px solid #1E293B;
      border-radius: 20px;
      padding: 32px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(34, 211, 238, 0.15);
      border: 1px solid #22D3EE;
      color: #22D3EE;
      font-size: 11px;
      font-weight: 800;
      border-radius: 999px;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    h2 { font-size: 24px; margin-bottom: 8px; color: #FFF; }
    p { font-size: 14px; color: #94A3B8; margin-bottom: 24px; line-height: 1.5; }
    .btn {
      background: #22D3EE;
      color: #0B0F17;
      border: none;
      padding: 14px 28px;
      font-size: 14px;
      font-weight: 800;
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.15s, background 0.15s;
    }
    .btn:hover { background: #38BDF8; transform: translateY(-2px); }
    .counter {
      margin-top: 20px;
      font-family: monospace;
      font-size: 16px;
      color: #10B981;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">LIVE BROWSER ENGINE</div>
    <h2>Interactive Web Preview</h2>
    <p>Edit HTML, CSS, or JavaScript and click Run to see immediate live changes.</p>
    <button class="btn" onclick="handleClick()">Click Me ⚡</button>
    <div class="counter" id="result">Clicks: 0</div>
  </div>

  <script>
    let count = 0;
    function handleClick() {
      count++;
      document.getElementById('result').textContent = 'Clicks: ' + count;
      console.log('Button clicked! Total clicks:', count);
    }
    console.log('Web preview loaded successfully.');
  </script>
</body>
</html>`,

  javascript: `// JavaScript (Node.js v22) Playground
// High-performance asynchronous execution with full standard library
const crypto = require("crypto");

console.log("⚡ S-CODERS JavaScript (Node.js) Playground");
console.log("Node Version:", process.version);
console.log("Platform Architecture:", process.platform, process.arch);

// 1. Data Processing
const dataset = [
  { student: "Aarav", score: 92 },
  { student: "Diya", score: 97 },
  { student: "Kabir", score: 89 },
  { student: "Ananya", score: 95 }
];

const totalScore = dataset.reduce((sum, item) => sum + item.score, 0);
const averageScore = totalScore / dataset.length;

console.log("\\nStudent Roster Summary:");
console.table(dataset);
console.log("Average Score:", averageScore.toFixed(2));

// 2. Cryptographic Security Token Generation
const secureToken = crypto.randomBytes(16).toString("hex");
console.log("\\nGenerated Session Hash:", secureToken);
`,

  typescript: `// TypeScript Playground with compile-time type verification
interface WorkshopRegistration {
  id: string;
  candidateName: string;
  track: "AI Systems" | "Full-Stack" | "Cloud";
  modulesCompleted: number;
  certified: boolean;
}

class LearningTrackManager {
  private registrations: WorkshopRegistration[] = [];

  enroll(student: WorkshopRegistration): void {
    this.registrations.push(student);
    console.log(\`[Enrolled]: \${student.candidateName} -> \${student.track}\`);
  }

  generateReport(): void {
    console.log(\`\\n--- Track Overview (\${this.registrations.length} Active Students) ---\`);
    for (const reg of this.registrations) {
      console.log(\`Candidate: \${reg.candidateName.padEnd(12)} | Modules: \${reg.modulesCompleted} | Certified: \${reg.certified ? "YES" : "IN PROGRESS"}\`);
    }
  }
}

const manager = new LearningTrackManager();
manager.enroll({ id: "W101", candidateName: "Shreyas", track: "AI Systems", modulesCompleted: 8, certified: true });
manager.enroll({ id: "W102", candidateName: "Pooja", track: "Full-Stack", modulesCompleted: 6, certified: true });
manager.enroll({ id: "W103", candidateName: "Vikram", track: "Cloud", modulesCompleted: 4, certified: false });
manager.generateReport();
`,

  sql: `-- S-CODERS SQLite Relational Database Engine
-- Creates in-memory schema, seeds test records, and executes queries

CREATE TABLE engineers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    experience_years INTEGER NOT NULL,
    rating REAL NOT NULL
);

INSERT INTO engineers (name, domain, experience_years, rating) VALUES
('Shreyas', 'AI & Machine Learning', 5, 4.9),
('Bharat', 'Cloud Infrastructure', 6, 4.8),
('Kiran', 'Full-Stack Architecture', 4, 4.7),
('Meera', 'Distributed Systems', 5, 4.95),
('Rohan', 'Cybersecurity', 3, 4.6);

-- Group by domain and compute averages
SELECT 
    domain, 
    COUNT(*) AS total_engineers, 
    ROUND(AVG(experience_years), 1) AS avg_experience,
    ROUND(AVG(rating), 2) AS avg_rating
FROM engineers
GROUP BY domain
ORDER BY avg_rating DESC;
`,

  csharp: `// S-CODERS C# .NET Execution Engine
using System;
using System.Collections.Generic;
using System.Linq;

namespace ScodersUniversal
{
    public record Developer(string Name, string Speciality, int ExperienceYears);

    public class Program
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("⚡ S-CODERS C# .NET Execution Engine");
            Console.WriteLine($"Running on .NET Runtime: {Environment.Version}");

            var team = new List<Developer>
            {
                new("Shreyas", "AI Engineering", 6),
                new("Priya", "Distributed Cloud", 5),
                new("Karthik", "Security Architecture", 7),
                new("Sneha", "Frontend Platforms", 4)
            };

            Console.WriteLine("\\nSenior Engineering Lead Roster (Exp >= 5):");
            var seniors = team.Where(d => d.ExperienceYears >= 5).OrderByDescending(d => d.ExperienceYears);

            foreach (var dev in seniors)
            {
                Console.WriteLine($" • {dev.Name} - {dev.Speciality} ({dev.ExperienceYears} yrs exp)");
            }
        }
    }
}
`,

  go: `// S-CODERS Go (Golang) Execution Engine
package main

import (
    "fmt"
    "runtime"
    "sync"
    "time"
)

func worker(id int, wg *sync.WaitGroup, results chan<- string) {
    defer wg.Done()
    time.Sleep(10 * time.Millisecond)
    results <- fmt.Sprintf("Goroutine #%d completed successfully", id)
}

func main() {
    fmt.Println("⚡ S-CODERS Go Universal Engine")
    fmt.Printf("Go Architecture: %s/%s with %d CPUs\\n\\n", runtime.GOOS, runtime.GOARCH, runtime.NumCPU())

    var wg sync.WaitGroup
    results := make(chan string, 4)

    for i := 1; i <= 4; i++ {
        wg.Add(1)
        go worker(i, &wg, results)
    }

    wg.Wait()
    close(results)

    fmt.Println("Concurrent Pipeline Execution Results:")
    for msg := range results {
        fmt.Println(" •", msg)
    }
}
`,

  rust: `// S-CODERS Rust Universal Compiler Engine
fn main() {
    println!("⚡ S-CODERS Rust Execution Engine");
    println!("Zero-cost abstractions with memory safety\\n");

    let mut numbers: Vec<i32> = vec![15, 28, 42, 67, 89, 99, 104];
    numbers.sort_by(|a, b| b.cmp(a));

    let sum: i32 = numbers.iter().sum();
    let count = numbers.len();
    let average = sum as f64 / count as f64;

    println!("Dataset Elements (Descending): {:?}", numbers);
    println!("Total Elements  : {}", count);
    println!("Sum of Elements : {}", sum);
    println!("Calculated Mean : {:.2}", average);
}
`,

  php: `<?php
// S-CODERS PHP 8 Execution Engine
echo "⚡ S-CODERS PHP Engine\\n";
echo "PHP Version: " . PHP_VERSION . "\\n\\n";

$students = [
    ["name" => "Aditya", "project" => "Microservices Mesh", "score" => 94],
    ["name" => "Neha", "project" => "LLM Agent Orchestration", "score" => 98],
    ["name" => "Siddharth", "project" => "High-Frequency WebSocket", "score" => 96]
];

echo str_pad("Candidate", 14) . " | " . str_pad("Project Track", 26) . " | Score\\n";
echo str_repeat("-", 50) . "\\n";

foreach ($students as $s) {
    echo str_pad($s["name"], 14) . " | " . str_pad($s["project"], 26) . " | " . $s["score"] . "%\\n";
}
echo "\\nPHP script executed with 0 errors.\\n";
`,

  ruby: `# S-CODERS Ruby 3 Execution Engine
puts "⚡ S-CODERS Ruby Universal Engine"
puts "Ruby Version: #{RUBY_VERSION} on #{RUBY_PLATFORM}\\n\\n"

class EngineeringCohort
  def initialize(title)
    @title = title
    @members = []
  end

  def add_member(name, score)
    @members << { name: name, score: score }
  end

  def summary
    puts "--- Cohort: #{@title} (#{@members.length} members) ---"
    @members.each do |m|
      puts " • #{m[:name].ljust(12)} - Score: #{m[:score]}%"
    end
    avg = @members.map { |m| m[:score] }.sum.to_f / @members.length
    puts "Average Cohort Velocity: #{avg.round(2)}%\\n"
  end
end

cohort = EngineeringCohort.new("Cloud & AI Masterclass")
cohort.add_member("Arun", 95)
cohort.add_member("Bhavna", 99)
cohort.add_member("Chetan", 92)
cohort.summary
`,

  bash: `#!/bin/bash
# S-CODERS Bash Shell Environment
echo "⚡ S-CODERS Bash Universal Shell"
echo "Bash Version: $BASH_VERSION"
echo "Host Operating System: $(uname -s) $(uname -m)"
echo "Current Timestamp: $(date)"

echo ""
echo "System Environment Variables:"
echo " • SHELL: $SHELL"
echo " • USER : $(whoami)"
echo " • PWD  : $PWD"

echo ""
echo "Simulating 3-Step Deployment Pipeline:"
for step in "Linting" "Compilation" "Verification"; do
    echo " [✓] Step complete: $step"
done
`
};

// Client-side automatic language detector
export function detectLanguageClient(code: string): SupportedLanguage | null {
  if (!code || typeof code !== 'string') return null;
  const trimmed = code.trim();

  // Java
  if (
    /public\s+class\s+[A-Za-z0-9_]+/.test(trimmed) ||
    /public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]/.test(trimmed) ||
    /System\.(out|err)\.(println|print|printf)/.test(trimmed) ||
    /import\s+java\.(util|io|lang|math|net|time|nio)\./.test(trimmed) ||
    /Scanner\s+[A-Za-z0-9_]+\s*=\s*new\s+Scanner/.test(trimmed)
  ) {
    return 'java';
  }

  // C++
  if (
    /#include\s*<iostream>/.test(trimmed) ||
    /#include\s*<vector>/.test(trimmed) ||
    /#include\s*<bits\/stdc\+\+\.h>/.test(trimmed) ||
    /std::(cout|cin|endl|vector|string|map)/.test(trimmed) ||
    /using\s+namespace\s+std\s*;/.test(trimmed) ||
    /(cout|cin)\s*(<<|>>)/.test(trimmed)
  ) {
    return 'cpp';
  }

  // C
  if (
    /#include\s*<stdio\.h>/.test(trimmed) ||
    /#include\s*<stdlib\.h>/.test(trimmed) ||
    /#include\s*<string\.h>/.test(trimmed) ||
    (/printf\s*\(/.test(trimmed) && /int\s+main\s*\(/.test(trimmed))
  ) {
    return 'c';
  }

  // HTML
  if (
    /<!DOCTYPE\s+html>/i.test(trimmed) ||
    /<html[\s>]/i.test(trimmed) ||
    /<body[\s>]/i.test(trimmed)
  ) {
    return 'html';
  }

  // React JSX
  if (
    /import\s+React/i.test(trimmed) ||
    /ReactDOM\.createRoot/i.test(trimmed) ||
    /export\s+default\s+function\s+[A-Za-z0-9_]+\s*\(/i.test(trimmed) ||
    /function\s+[A-Z][A-Za-z0-9_]*\s*\([^)]*\)\s*\{[\s\S]*return\s*\(\s*</.test(trimmed) ||
    (/useState\s*\([^)]*\)/.test(trimmed) && /<[a-z0-9]+>/i.test(trimmed))
  ) {
    return 'react';
  }

  // C#
  if (
    /using\s+System\s*;/.test(trimmed) ||
    /Console\.(WriteLine|ReadLine|Write)/.test(trimmed) ||
    (/namespace\s+[A-Za-z0-9_]+/.test(trimmed) && /class\s+[A-Za-z0-9_]+/.test(trimmed))
  ) {
    return 'csharp';
  }

  // Go
  if (
    /package\s+main\b/.test(trimmed) ||
    /import\s*\(\s*"fmt"/.test(trimmed) ||
    /func\s+main\s*\(\s*\)/.test(trimmed) ||
    /fmt\.(Println|Printf|Print)/.test(trimmed)
  ) {
    return 'go';
  }

  // Rust
  if (
    /fn\s+main\s*\(\s*\)/.test(trimmed) ||
    /println!\s*\(/.test(trimmed) ||
    /use\s+std::/.test(trimmed) ||
    /let\s+mut\s+/.test(trimmed)
  ) {
    return 'rust';
  }

  // PHP
  if (/<\?php/i.test(trimmed) || (/\$\w+\s*=/.test(trimmed) && /echo\s+/.test(trimmed))) {
    return 'php';
  }

  // Ruby
  if (
    (/puts\s+["']/.test(trimmed) || /require\s+['"]/.test(trimmed)) &&
    /def\s+[A-Za-z0-9_]+/.test(trimmed) &&
    /\bend\b/.test(trimmed) &&
    !trimmed.includes(':')
  ) {
    return 'ruby';
  }

  // SQL
  if (/^\s*(SELECT|INSERT\s+INTO|CREATE\s+TABLE|UPDATE|DELETE\s+FROM|WITH)\b/i.test(trimmed)) {
    return 'sql';
  }

  // Bash
  if (/^#!\/bin\/(bash|sh)/.test(trimmed) || (/echo\s+["']/.test(trimmed) && /for\s+\w+\s+in\s+/.test(trimmed))) {
    return 'bash';
  }

  // TypeScript
  if (
    (/interface\s+[A-Za-z0-9_]+/.test(trimmed) || /type\s+[A-Za-z0-9_]+\s*=/.test(trimmed)) &&
    (trimmed.includes(': string') || trimmed.includes(': number') || trimmed.includes(': boolean'))
  ) {
    return 'typescript';
  }

  // Python
  if (
    /def\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*:/.test(trimmed) ||
    /import\s+(math|sys|os|json|re|numpy|pandas|matplotlib|scipy|requests|random|datetime)/.test(trimmed) ||
    /from\s+[A-Za-z0-9_.]+\s+import/.test(trimmed) ||
    /if\s+__name__\s*==\s*['"]__main__['"]\s*:/.test(trimmed) ||
    (/print\s*\(/.test(trimmed) && !trimmed.includes(';') && !trimmed.includes('{'))
  ) {
    return 'python';
  }

  // JavaScript
  if (
    /console\.(log|warn|error)\s*\(/.test(trimmed) ||
    /const\s+[A-Za-z0-9_]+\s*=/.test(trimmed) ||
    /let\s+[A-Za-z0-9_]+\s*=/.test(trimmed) ||
    /function\s+[A-Za-z0-9_]+\s*\(/.test(trimmed)
  ) {
    return 'javascript';
  }

  return null;
}

interface ProjectFile {
  name: string;
  content: string;
}

interface ExecutionHistoryItem {
  id: string;
  timestamp: string;
  language: SupportedLanguage;
  fileName: string;
  code: string;
  status: 'success' | 'error';
  durationMs?: number;
}

interface AiDebugResult {
  errorType: string;
  line: number | null;
  explanation: string;
  correctedCode: string;
  suggestedFixSummary: string;
}

interface AiExplainResult {
  summary: string;
  keyConcepts: string[];
  lineByLine: { lines: string; title: string; explanation: string }[];
  complexity: string;
}

interface OnlineCodePlaygroundProps {
  workshopTitle?: string;
  initialLanguage?: SupportedLanguage;
  initialCode?: string;
  onCodeChange?: (code: string) => void;
}

export const OnlineCodePlayground: React.FC<OnlineCodePlaygroundProps> = ({
  workshopTitle = 'S-CODERS Universal Code Studio',
  initialLanguage = 'python',
  initialCode,
  onCodeChange,
}) => {
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState<boolean>(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'files' | 'languages' | 'packages' | 'history' | 'settings'>('files');

  const [files, setFiles] = useState<ProjectFile[]>([
    {
      name: `Main.${LANGUAGES.find((l) => l.id === initialLanguage)?.extension || 'py'}`,
      content: initialCode || STARTER_TEMPLATES[initialLanguage],
    },
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);

  const activeFile = files[activeFileIndex] || files[0];
  const code = activeFile.content;

  // Stdin & Execution states
  const [stdin, setStdin] = useState<string>('');
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'console' | 'preview' | 'ai' | 'packages'>('console');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runStage, setRunStage] = useState<'idle' | 'preparing' | 'compiling' | 'executing' | 'done'>('idle');

  const [consoleOutput, setConsoleOutput] = useState<string>('Click "Run Code" (or press Ctrl+Enter) to execute your program.');
  const [stderrOutput, setStderrOutput] = useState<string | null>(null);
  const [plotImageBase64, setPlotImageBase64] = useState<string | null>(null);
  const [executionStats, setExecutionStats] = useState<{
    timeMs?: number;
    exitCode?: number;
    language?: string;
    runtimeVersion?: string;
  } | null>(null);

  // Interactive Terminal Console Session States
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [isWaitingInput, setIsWaitingInput] = useState<boolean>(false);
  const [waitingPromptText, setWaitingPromptText] = useState<string>('');
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const consoleBottomRef = useRef<HTMLDivElement>(null);
  const activeEventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll terminal log to bottom on new output or prompt
  useEffect(() => {
    if (activeTab === 'console') {
      consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleOutput, isWaitingInput, stderrOutput]);

  // AI Assistant States
  const [isAiDebugging, setIsAiDebugging] = useState<boolean>(false);
  const [aiDebugResult, setAiDebugResult] = useState<AiDebugResult | null>(null);
  const [isAiExplaining, setIsAiExplaining] = useState<boolean>(false);
  const [aiExplainResult, setAiExplainResult] = useState<AiExplainResult | null>(null);
  const [appliedFixNotice, setAppliedFixNotice] = useState<string | null>(null);

  // History & Drawer States
  const [historyItems, setHistoryItems] = useState<ExecutionHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('scoders_compiler_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [detectedLangNotice, setDetectedLangNotice] = useState<string | null>(null);
  const [languageSearchQuery, setLanguageSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Settings
  const [fontSize, setFontSize] = useState<number>(13);
  const [tabSpaces, setTabSpaces] = useState<number>(4);
  const [lineWrap, setLineWrap] = useState<boolean>(false);

  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentLangMeta = useMemo(() => {
    return LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];
  }, [language]);

  // Sensitive API key regex detector
  const securityWarning = useMemo(() => {
    if (!code) return null;
    if (/sk-[a-zA-Z0-9]{20,}/.test(code)) return 'OpenAI / Claude Secret Key Pattern Detected';
    if (/AIza[0-9A-Za-z-_]{35}/.test(code)) return 'Google Cloud / Gemini API Key Pattern Detected';
    if (/ghp_[0-9a-zA-Z]{36}/.test(code)) return 'GitHub Personal Access Token Detected';
    return null;
  }, [code]);

  // Sync prop changes
  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      setFiles((prev) => {
        const copy = [...prev];
        copy[0] = { ...copy[0], content: initialCode };
        return copy;
      });
    }
  }, [initialCode]);

  // Save history to localStorage
  const saveHistoryItem = (item: ExecutionHistoryItem) => {
    setHistoryItems((prev) => {
      const next = [item, ...prev.slice(0, 19)];
      try {
        localStorage.setItem('scoders_compiler_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Line numbers
  const lineNumbersString = useMemo(() => {
    const count = Math.max(code.split('\n').length, 1);
    const nums: string[] = [];
    for (let i = 1; i <= Math.min(count, 1500); i++) {
      nums.push(String(i));
    }
    return nums.join('\n');
  }, [code]);

  // Code update handler with smart auto-detection
  const handleCodeChange = (newCode: string) => {
    setFiles((prev) => {
      const copy = [...prev];
      copy[activeFileIndex] = { ...copy[activeFileIndex], content: newCode };
      return copy;
    });

    if (onCodeChange) onCodeChange(newCode);

    // Automatic Language Detection when pasting or writing foreign code
    if (autoDetectEnabled && newCode.trim().length > 15) {
      const detected = detectLanguageClient(newCode);
      if (detected && detected !== language) {
        const detectedMeta = LANGUAGES.find((l) => l.id === detected);
        setDetectedLangNotice(`✨ Auto-Detected ${detectedMeta?.name || detected} source code. Switching environment...`);

        // Automatically switch language if the match is unequivocal (e.g. Java, C++, HTML, React, Go)
        const isStrongMatch =
          detected === 'java' ||
          detected === 'cpp' ||
          detected === 'c' ||
          detected === 'react' ||
          detected === 'html' ||
          detected === 'go' ||
          detected === 'rust' ||
          detected === 'csharp';

        if (isStrongMatch) {
          handleSwitchLanguage(detected, false);
        }
      } else {
        setDetectedLangNotice(null);
      }
    }
  };

  // Switch Language
  const handleSwitchLanguage = (targetLang: SupportedLanguage, resetContent = true) => {
    setLanguage(targetLang);
    setDetectedLangNotice(null);
    setAiDebugResult(null);
    setAiExplainResult(null);
    setAppliedFixNotice(null);
    setPlotImageBase64(null);

    const targetMeta = LANGUAGES.find((l) => l.id === targetLang);
    if (targetMeta?.hasLiveUI) {
      setActiveTab('preview');
    } else {
      setActiveTab('console');
    }

    const newExt = targetMeta?.extension || 'txt';
    const mainFileName = targetLang === 'java' ? 'Main.java' : `main.${newExt}`;

    setFiles((prev) => {
      const copy = [...prev];
      const isDefaultContent = Object.values(STARTER_TEMPLATES).some((tmpl) => tmpl.trim() === copy[0].content.trim());
      copy[0] = {
        name: mainFileName,
        content: resetContent || isDefaultContent || !copy[0].content.trim() ? STARTER_TEMPLATES[targetLang] : copy[0].content,
      };
      return copy;
    });
  };

  // Multi-File actions
  const handleAddFile = () => {
    const ext = currentLangMeta.extension;
    const count = files.length + 1;
    const fileName = prompt(`Enter new file name (e.g., utils.${ext}):`, `file${count}.${ext}`);
    if (!fileName) return;

    setFiles((prev) => [...prev, { name: fileName.trim(), content: `// ${fileName}\n` }]);
    setActiveFileIndex(files.length);
  };

  const handleRemoveFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (activeFileIndex >= index) {
      setActiveFileIndex(Math.max(0, activeFileIndex - 1));
    }
  };

  const handleResetTemplate = () => {
    const tmpl = STARTER_TEMPLATES[language];
    handleCodeChange(tmpl);
    setConsoleOutput('Template reset to default. Click "Run Code" to execute.');
    setStderrOutput(null);
    setPlotImageBase64(null);
    setExecutionStats(null);
    setAiDebugResult(null);
    setAiExplainResult(null);
    setAppliedFixNotice(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadCode = () => {
    const ext = currentLangMeta.extension;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name || `program.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to run
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
    }
    // Tab key indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const spaces = ' '.repeat(tabSpaces);
      const nextCode = code.substring(0, start) + spaces + code.substring(end);
      handleCodeChange(nextCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + tabSpaces;
      }, 0);
    }
  };


  // EXECUTION DISPATCHER
  const handleRunCode = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setRunStage('preparing');
    setStderrOutput(null);
    setPlotImageBase64(null);
    setAiDebugResult(null);
    setAppliedFixNotice(null);

    // 1. WEB UI EXECUTION (HTML / React)
    if (language === 'html' || language === 'react') {
      setActiveTab('preview');
      renderWebSandbox(language, code);
      setIsRunning(false);
      setRunStage('done');
      saveHistoryItem({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        language,
        fileName: activeFile.name,
        code,
        status: 'success',
        durationMs: 45,
      });
      return;
    }

    // 2. NATIVE BACKEND COMPILER RUNTIME (Java, Python, C, C++, JS, TS, SQL, Go, Rust, C#, PHP, Ruby, Bash)
    setActiveTab('console');
    setConsoleOutput(`⚡ [Initializing Environment: ${currentLangMeta.versionLabel}]...\n`);
    setStderrOutput(null);
    setAiDebugResult(null);
    setPlotImageBase64(null);
    setExecutionStats(null);
    setIsWaitingInput(false);
    setWaitingPromptText('');

    if (activeEventSourceRef.current) {
      activeEventSourceRef.current.close();
      activeEventSourceRef.current = null;
    }

    try {
      // 1. Start interactive session
      const startResp = await fetch('/api/compiler/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          stdin: showStdin && stdin ? stdin : undefined,
        }),
      });

      if (!startResp.ok) {
        throw new Error(`Failed to start session (${startResp.statusText})`);
      }

      const sessionData = await startResp.json();
      const currentSessionId = sessionData.sessionId;
      setActiveSessionId(currentSessionId);
      setRunStage('executing');

      let receivedFirstChunk = false;

      // 2. Connect to Server-Sent Events stream
      const eventSource = new EventSource(`/api/compiler/session/stream?sessionId=${currentSessionId}`);
      activeEventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'stdout' && data.text) {
            if (!receivedFirstChunk) {
              receivedFirstChunk = true;
              setConsoleOutput('');
            }
            setConsoleOutput((prev) => prev + data.text);
          } else if (data.type === 'stderr' && data.text) {
            setStderrOutput((prev) => (prev ? prev + '\n' : '') + data.text);
          } else if (data.type === 'waiting_input') {
            setIsWaitingInput(true);
            setWaitingPromptText(data.text || 'Waiting for user input...');
            setTimeout(() => {
              terminalInputRef.current?.focus();
            }, 60);
          } else if (data.type === 'plot' && data.plotImageBase64) {
            setPlotImageBase64(data.plotImageBase64);
          } else if (data.type === 'exit') {
            setExecutionStats({
              timeMs: data.executionTimeMs,
              exitCode: data.exitCode,
              language: data.language,
              runtimeVersion: data.runtimeVersion,
            });

            setIsRunning(false);
            setIsWaitingInput(false);
            setWaitingPromptText('');
            setRunStage('done');
            eventSource.close();
            activeEventSourceRef.current = null;
            setActiveSessionId(null);

            saveHistoryItem({
              id: Math.random().toString(36).substring(2, 9),
              timestamp: new Date().toLocaleTimeString(),
              language,
              fileName: activeFile.name,
              code,
              status: data.exitCode === 0 ? 'success' : 'error',
              durationMs: data.executionTimeMs,
            });
          }
        } catch (parseErr) {
          console.error('Error parsing SSE event:', parseErr);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        activeEventSourceRef.current = null;
        if (isRunning) {
          setIsRunning(false);
          setRunStage('done');
        }
      };
    } catch (err: any) {
      // Resilient fallback to batch execute
      try {
        const response = await fetch('/api/compiler/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language,
            code,
            stdin: showStdin ? stdin : undefined,
          }),
        });

        const data = await response.json();
        setExecutionStats({
          timeMs: data.executionTimeMs,
          exitCode: data.exitCode,
          language: data.language,
          runtimeVersion: data.runtimeVersion,
        });

        if (data.success) {
          setConsoleOutput(data.stdout || '[Program finished with no stdout output]');
          setStderrOutput(data.stderr ? data.stderr : null);
        } else {
          setConsoleOutput(data.stdout || '');
          setStderrOutput(data.stderr || 'Execution failed with non-zero exit code.');
        }

        if (data.plotImageBase64) {
          setPlotImageBase64(data.plotImageBase64);
        }

        saveHistoryItem({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          language,
          fileName: activeFile.name,
          code,
          status: data.success ? 'success' : 'error',
          durationMs: data.executionTimeMs,
        });
      } catch (fallbackErr: any) {
        setStderrOutput(`Execution Error: Could not reach execution engine.\n${err?.message || err}`);
        setConsoleOutput('');
      } finally {
        setIsRunning(false);
        setRunStage('done');
      }
    }
  };

  // SEND INPUT TO RUNNING INTERACTIVE SESSION
  const sendTerminalInput = async () => {
    if (!terminalInput && terminalInput !== '0') return;
    const inputVal = terminalInput;
    setTerminalInput('');
    setIsWaitingInput(false);
    setWaitingPromptText('');

    // Echo input into the terminal output in bold cyan
    setConsoleOutput((prev) => prev + inputVal + '\n');

    if (activeSessionId) {
      try {
        await fetch('/api/compiler/session/input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: activeSessionId, input: inputVal }),
        });
      } catch (err) {
        console.error('Failed to send terminal input:', err);
      }
    }
  };

  // STOP CURRENTLY RUNNING PROGRAM
  const handleStopExecution = async () => {
    if (activeSessionId) {
      try {
        await fetch('/api/compiler/session/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: activeSessionId }),
        });
      } catch (e) {}
    }
    if (activeEventSourceRef.current) {
      activeEventSourceRef.current.close();
      activeEventSourceRef.current = null;
    }
    setIsRunning(false);
    setIsWaitingInput(false);
    setWaitingPromptText('');
    setRunStage('done');
    setStderrOutput((prev) => (prev ? prev + '\n' : '') + '[Execution Stopped by User]');
    setActiveSessionId(null);
  };

  // AI ERROR DEBUGGER CALL
  const handleAiDebug = async () => {
    setIsAiDebugging(true);
    setAppliedFixNotice(null);
    try {
      const response = await fetch('/api/compiler/ai-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          stderr: stderrOutput,
          stdout: consoleOutput,
          exitCode: executionStats?.exitCode ?? 1,
        }),
      });

      const data = await response.json();
      setAiDebugResult(data);
    } catch (e: any) {
      setAiDebugResult({
        errorType: 'Network Error',
        line: null,
        explanation: 'Could not connect to AI Debugger: ' + e.message,
        correctedCode: code,
        suggestedFixSummary: 'Please verify server connectivity.',
      });
    } finally {
      setIsAiDebugging(false);
    }
  };

  // 1-Click Apply AI Fix
  const handleApplyAiFix = () => {
    if (!aiDebugResult?.correctedCode) return;
    handleCodeChange(aiDebugResult.correctedCode);
    setAppliedFixNotice('✨ AI-corrected code applied to editor! Click "Run Code" to verify.');
    setStderrOutput(null);
    setAiDebugResult(null);
  };

  // AI LINE-BY-LINE CODE EXPLAINER
  const handleAiExplain = async () => {
    setIsAiExplaining(true);
    setActiveTab('ai');
    try {
      const response = await fetch('/api/compiler/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code }),
      });
      const data = await response.json();
      setAiExplainResult(data);
    } catch (e: any) {
      setAiExplainResult({
        summary: 'Error contacting AI explanation service.',
        keyConcepts: ['Execution'],
        lineByLine: [{ lines: 'All', title: 'Error', explanation: e.message }],
        complexity: 'N/A',
      });
    } finally {
      setIsAiExplaining(false);
    }
  };

  // Render Web Sandbox in iframe
  const renderWebSandbox = (lang: 'html' | 'react', sourceCode: string) => {
    if (!previewIframeRef.current) return;

    let fullHtml = '';

    if (lang === 'html') {
      fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    ['log', 'info', 'warn', 'error'].forEach(method => {
      const original = console[method];
      console[method] = function(...args) {
        window.parent.postMessage({
          type: 'scoders_console',
          level: method,
          message: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
        }, '*');
        original.apply(console, args);
      };
    });
    window.onerror = function(msg, url, line) {
      console.error('Runtime Error: ' + msg + ' (Line ' + line + ')');
    };
  </script>
</head>
<body class="bg-[#0B0F17] text-white">
  ${sourceCode}
</body>
</html>
      `;
    } else if (lang === 'react') {
      fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script crossorigin src="https://unpkg.com/react@19/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 16px; background-color: #0B0F17; color: #E2E8F0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
  <script>
    ['log', 'info', 'warn', 'error'].forEach(method => {
      const original = console[method];
      console[method] = function(...args) {
        window.parent.postMessage({
          type: 'scoders_console',
          level: method,
          message: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
        }, '*');
        original.apply(console, args);
      };
    });
    window.onerror = function(msg, url, line) {
      console.error('React Runtime Error: ' + msg + ' (Line ' + line + ')');
    };
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      ${sourceCode}
    } catch (err) {
      console.error("Compilation / Execution Error: " + err.message);
      document.getElementById('root').innerHTML = '<div style="color: #F87171; padding: 20px; font-family: monospace; background: rgba(239,68,68,0.1); border: 1px solid #EF4444; border-radius: 12px;"><strong>React Error:</strong> ' + err.message + '</div>';
    }
  </script>
</body>
</html>
      `;
    }

    const iframeDoc = previewIframeRef.current.contentDocument || previewIframeRef.current.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(fullHtml);
      iframeDoc.close();
    }
  };

  // Listen to messages from sandbox iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'scoders_console') {
        const { level, message } = event.data;
        const prefix = level === 'error' ? '❌ [ERROR]:' : level === 'warn' ? '⚠️ [WARN]:' : '📟 [LOG]:';
        setConsoleOutput((prev) => `${prev}\n${prefix} ${message}`);
        if (level === 'error') {
          setStderrOutput(message);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Filtered languages for the picker
  const filteredLanguages = useMemo(() => {
    return LANGUAGES.filter((l) => {
      const matchesSearch =
        l.name.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
        l.extension.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
        l.versionLabel.toLowerCase().includes(languageSearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || l.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [languageSearchQuery, selectedCategory]);

  return (
    <div
      className={`transition-all duration-300 flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#0B0F17] p-2 sm:p-4 overflow-y-auto'
          : 'w-full rounded-2xl border border-white/10 bg-[#0A0E17] overflow-hidden shadow-2xl'
      }`}
    >
      {/* SECURITY NOTICE BANNER */}
      {securityWarning && (
        <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 flex items-center justify-between text-xs font-mono text-amber-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Security Notice:</strong> {securityWarning}. Never share or paste private API keys in client environments.
            </span>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold uppercase">Private</span>
        </div>
      )}

      {/* VS CODE TOP TOOLBAR */}
      <div className="bg-[#0D131F] border-b border-white/10 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Studio branding & breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-brand-teal font-display font-bold text-xs sm:text-sm">
            <Code2 className="w-4 h-4 text-brand-teal animate-pulse" />
            <span className="text-white font-extrabold">{workshopTitle}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            <span className="text-gray-500">workspace</span>
            <span className="text-gray-600">/</span>
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5" />
              {activeFile.name}
            </span>
          </div>
        </div>

        {/* Center/Right: Language runtime selector, Auto-detect toggle & Actions */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Auto-Detect Switch */}
          <button
            onClick={() => setAutoDetectEnabled(!autoDetectEnabled)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              autoDetectEnabled
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 font-bold'
                : 'bg-white/5 text-gray-400 border-white/10'
            }`}
            title="Automatically detect programming language when code is pasted"
          >
            <Sparkles className={`w-3.5 h-3.5 ${autoDetectEnabled ? 'text-cyan-400' : 'text-gray-500'}`} />
            <span className="hidden sm:inline">Auto-Detect:</span>
            <span>{autoDetectEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative inline-block">
            <select
              value={language}
              onChange={(e) => handleSwitchLanguage(e.target.value as SupportedLanguage)}
              className="appearance-none bg-[#131A29] text-white font-mono text-xs px-3 py-1.5 pr-8 rounded-xl border border-white/15 focus:outline-none focus:border-brand-teal cursor-pointer shadow-sm hover:border-brand-teal/50 transition-colors font-semibold"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-[#0F172A] text-white">
                  {lang.name} {lang.hasLiveUI ? '⚡ (Live UI)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Explain Code (AI) */}
          <button
            onClick={handleAiExplain}
            disabled={isAiExplaining}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 rounded-xl transition-all cursor-pointer text-xs font-mono flex items-center gap-1"
            title="Explain this program line-by-line"
          >
            {isAiExplaining ? (
              <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="hidden lg:inline">Explain</span>
          </button>

          {/* Template Reset */}
          <button
            onClick={handleResetTemplate}
            className="p-1.5 sm:px-2 sm:py-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer text-xs font-mono flex items-center gap-1"
            title="Reset code template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Reset</span>
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="p-1.5 sm:px-2 sm:py-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer text-xs font-mono flex items-center gap-1"
            title="Copy code"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-brand-teal" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download Code */}
          <button
            onClick={handleDownloadCode}
            className="p-1.5 sm:px-2 sm:py-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer text-xs font-mono flex items-center gap-1"
            title="Download source file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 sm:px-2 sm:py-1.5 text-gray-400 hover:text-brand-teal bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer text-xs font-mono"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* STOP BUTTON */}
          {isRunning && (
            <button
              onClick={handleStopExecution}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30"
              title="Abort execution"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {/* MASTER RUN CODE BUTTON */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-1.5 bg-brand-teal hover:bg-white text-brand-dark font-display font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-brand-teal/25"
          >
            {isRunning ? (
              <span className="w-3 h-3 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* LANGUAGE DETECTION NOTIFICATION BANNER */}
      {detectedLangNotice && (
        <div className="bg-brand-teal/15 border-b border-brand-teal/30 px-4 py-2 flex items-center justify-between text-xs font-mono text-cyan-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-teal shrink-0" />
            <span>{detectedLangNotice}</span>
          </div>
          <button
            onClick={() => setDetectedLangNotice(null)}
            className="text-gray-400 hover:text-white px-1.5 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* APPLIED FIX BANNER */}
      {appliedFixNotice && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2 flex items-center justify-between text-xs font-mono text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedFixNotice}</span>
          </div>
          <button
            onClick={() => setAppliedFixNotice(null)}
            className="text-gray-400 hover:text-white px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN PLAYGROUND BODY: VS CODE ACTIVITY BAR + SPLIT VIEW */}
      <div className="flex flex-1 min-h-[500px]">
        {/* LEFT ACTIVITY BAR */}
        <div className="w-11 bg-[#090D16] border-r border-white/10 flex flex-col items-center py-2 gap-3 shrink-0 select-none">
          {/* File Explorer Tab */}
          <button
            onClick={() => setActiveSidebarTab(activeSidebarTab === 'files' ? 'files' : 'files')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeSidebarTab === 'files' ? 'text-brand-teal bg-white/10' : 'text-gray-400 hover:text-white'
            }`}
            title="Explorer (Files)"
          >
            <FileCode className="w-4 h-4" />
          </button>

          {/* Languages Drawer */}
          <button
            onClick={() => setActiveSidebarTab(activeSidebarTab === 'languages' ? 'files' : 'languages')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeSidebarTab === 'languages' ? 'text-brand-teal bg-white/10' : 'text-gray-400 hover:text-white'
            }`}
            title="All Supported Languages (15+)"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Packages & Libraries Tab */}
          <button
            onClick={() => setActiveSidebarTab(activeSidebarTab === 'packages' ? 'files' : 'packages')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeSidebarTab === 'packages' ? 'text-brand-teal bg-white/10' : 'text-gray-400 hover:text-white'
            }`}
            title="Built-in Libraries & Packages"
          >
            <Package className="w-4 h-4" />
          </button>

          {/* History Tab */}
          <button
            onClick={() => setActiveSidebarTab(activeSidebarTab === 'history' ? 'files' : 'history')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              activeSidebarTab === 'history' ? 'text-brand-teal bg-white/10' : 'text-gray-400 hover:text-white'
            }`}
            title="Execution History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setActiveSidebarTab(activeSidebarTab === 'settings' ? 'files' : 'settings')}
            className={`p-2 rounded-lg transition-colors cursor-pointer mt-auto ${
              activeSidebarTab === 'settings' ? 'text-brand-teal bg-white/10' : 'text-gray-400 hover:text-white'
            }`}
            title="Editor Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* SECONDARY SIDEBAR DRAWER (When Languages, Packages, History or Settings is active) */}
        {activeSidebarTab !== 'files' && (
          <div className="w-64 bg-[#0B0F19] border-r border-white/10 p-3 flex flex-col shrink-0 overflow-y-auto">
            {/* 1. LANGUAGES DRAWER */}
            {activeSidebarTab === 'languages' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Supported Languages</span>
                  <button onClick={() => setActiveSidebarTab('files')} className="text-gray-400 hover:text-white text-xs">✕</button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search languages..."
                    value={languageSearchQuery}
                    onChange={(e) => setLanguageSearchQuery(e.target.value)}
                    className="w-full bg-[#131A29] text-white text-xs font-mono pl-8 pr-2 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-brand-teal"
                  />
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {['all', 'compiled', 'interpreted', 'web', 'systems'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                        selectedCategory === cat ? 'bg-brand-teal text-brand-dark font-bold' : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Language list */}
                <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                  {filteredLanguages.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        handleSwitchLanguage(l.id);
                        setActiveSidebarTab('files');
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs font-mono flex items-center justify-between border transition-all cursor-pointer ${
                        language === l.id
                          ? 'bg-brand-teal/15 text-brand-teal border-brand-teal/40 font-bold'
                          : 'bg-white/5 text-gray-300 border-transparent hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{l.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">.{l.extension}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. PACKAGES & LIBRARIES DRAWER */}
            {activeSidebarTab === 'packages' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Built-in Libraries</span>
                  <button onClick={() => setActiveSidebarTab('files')} className="text-gray-400 hover:text-white text-xs">✕</button>
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Environment: <span className="text-cyan-300 font-bold">{currentLangMeta.name}</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  These packages and standard modules are pre-installed and available immediately without configuration:
                </p>
                <div className="space-y-1.5">
                  {currentLangMeta.libraries.map((lib, idx) => (
                    <div key={idx} className="p-2 bg-[#131A29] border border-white/10 rounded-lg text-xs font-mono text-cyan-200 flex items-center justify-between">
                      <span>{lib}</span>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. RUN HISTORY DRAWER */}
            {activeSidebarTab === 'history' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Execution History</span>
                  <button onClick={() => setActiveSidebarTab('files')} className="text-gray-400 hover:text-white text-xs">✕</button>
                </div>
                {historyItems.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono py-4 text-center">No past runs recorded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {historyItems.map((item) => (
                      <div key={item.id} className="p-2 bg-[#131A29] border border-white/10 rounded-lg text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-cyan-300 font-bold">{item.language.toUpperCase()}</span>
                          <span className={item.status === 'success' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            {item.durationMs ? `${item.durationMs}ms` : item.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400">{item.timestamp}</div>
                        <button
                          onClick={() => {
                            handleCodeChange(item.code);
                            handleSwitchLanguage(item.language);
                            setActiveSidebarTab('files');
                          }}
                          className="w-full mt-1 py-1 bg-white/5 hover:bg-brand-teal hover:text-brand-dark rounded text-[10px] font-bold text-gray-300 transition-colors"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. SETTINGS DRAWER */}
            {activeSidebarTab === 'settings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Editor Settings</span>
                  <button onClick={() => setActiveSidebarTab('files')} className="text-gray-400 hover:text-white text-xs">✕</button>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-gray-300 block">Font Size ({fontSize}px)</label>
                  <div className="flex gap-1.5">
                    {[12, 13, 14, 16].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setFontSize(sz)}
                        className={`flex-1 py-1 rounded text-xs font-mono ${fontSize === sz ? 'bg-brand-teal text-brand-dark font-bold' : 'bg-white/5 text-gray-400'}`}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-gray-300 block">Tab Indentation</label>
                  <div className="flex gap-1.5">
                    {[2, 4].map((spaces) => (
                      <button
                        key={spaces}
                        onClick={() => setTabSpaces(spaces)}
                        className={`flex-1 py-1 rounded text-xs font-mono ${tabSpaces === spaces ? 'bg-brand-teal text-brand-dark font-bold' : 'bg-white/5 text-gray-400'}`}
                      >
                        {spaces} Spaces
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-gray-300 block">Line Wrapping</label>
                  <button
                    onClick={() => setLineWrap(!lineWrap)}
                    className={`w-full py-1.5 rounded text-xs font-mono border ${lineWrap ? 'bg-brand-teal/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-gray-400 border-white/10'}`}
                  >
                    {lineWrap ? 'Enabled (Soft Wrap)' : 'Disabled (Horizontal Scroll)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SPLIT PANE: EDITOR (LEFT) + OUTPUT (RIGHT) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          {/* LEFT: SOURCE CODE EDITOR */}
          <div className="flex flex-col bg-[#050811] relative">
            {/* File Tabs Bar */}
            <div className="bg-[#080D18] px-2 py-1.5 border-b border-white/10 flex items-center justify-between gap-1 overflow-x-auto">
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveFileIndex(idx)}
                    className={`group px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer border transition-colors ${
                      activeFileIndex === idx
                        ? 'bg-[#131A29] text-brand-teal border-brand-teal/40 font-semibold shadow-sm'
                        : 'bg-white/5 text-gray-400 border-transparent hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-brand-teal/70" />
                    <span>{file.name}</span>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => handleRemoveFile(idx, e)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={handleAddFile}
                  className="p-1 text-gray-400 hover:text-brand-teal bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
                  title="Add file to project"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">File</span>
                </button>
              </div>

              <div className="text-[10px] text-gray-500 font-mono hidden sm:block shrink-0 pr-2">
                <kbd className="bg-white/10 px-1 py-0.5 rounded text-gray-300">Ctrl</kbd> +{' '}
                <kbd className="bg-white/10 px-1 py-0.5 rounded text-gray-300">Enter</kbd> to run
              </div>
            </div>

            {/* Editor Area with Line Numbers */}
            <div className="relative flex-1 flex overflow-hidden min-h-[340px] sm:min-h-[460px]">
              <pre
                aria-hidden="true"
                style={{ fontSize: `${fontSize}px` }}
                className="w-12 py-3 select-none bg-[#070B14] text-gray-600 font-mono text-right pr-3 shrink-0 border-r border-white/5 overflow-hidden leading-6 font-normal m-0"
              >
                {lineNumbersString}
              </pre>

              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                style={{ fontSize: `${fontSize}px` }}
                placeholder={`// Write or paste your ${currentLangMeta.name} program here...`}
                className={`w-full flex-1 bg-transparent text-emerald-300 font-mono p-3 focus:outline-none resize-none leading-6 overflow-y-auto selection:bg-brand-teal/25 font-normal ${
                  lineWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'
                }`}
              />
            </div>

            {/* Bottom Bar for Stdin */}
            <div className="bg-[#080D18] border-t border-white/5 p-2 px-3 flex items-center justify-between">
              <button
                onClick={() => setShowStdin(!showStdin)}
                className="text-[11px] font-mono text-gray-400 hover:text-brand-teal flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStdin ? 'rotate-180' : ''}`} />
                <span>{showStdin ? 'Hide Standard Input (stdin)' : 'Pass Standard Input (stdin)'}</span>
              </button>
              <span className="text-[10px] font-mono text-gray-500">
                {code.split('\n').length} lines • UTF-8 • {tabSpaces} spaces
              </span>
            </div>

            {/* Stdin Input Area */}
            {showStdin && (
              <div className="p-3 bg-[#03060F] border-t border-white/5">
                <label className="text-[10px] font-mono text-brand-teal uppercase tracking-wider block mb-1">
                  Standard Input (input() / Scanner / cin / readline):
                </label>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input values here (one per line)..."
                  rows={2}
                  className="w-full bg-[#080D18] border border-white/10 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-brand-teal"
                />
              </div>
            )}
          </div>

          {/* RIGHT: OUTPUT / LIVE PREVIEW / AI DEBUGGER / LIBRARIES */}
          <div className="flex flex-col bg-[#070B14] relative">
            {/* Output Tabs Bar */}
            <div className="bg-[#080D18] px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                {/* Console Tab */}
                <button
                  onClick={() => setActiveTab('console')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'console'
                      ? 'bg-brand-teal text-brand-dark shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Terminal</span>
                </button>

                {/* Preview Tab */}
                <button
                  onClick={() => {
                    setActiveTab('preview');
                    if (currentLangMeta.hasLiveUI) {
                      renderWebSandbox(language as 'html' | 'react', code);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-brand-teal text-brand-dark shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Preview</span>
                  {currentLangMeta.hasLiveUI && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                </button>

                {/* AI Tutor Tab */}
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'ai'
                      ? 'bg-brand-teal text-brand-dark shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Tutor</span>
                </button>

                {/* Libraries Tab */}
                <button
                  onClick={() => setActiveTab('packages')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'packages'
                      ? 'bg-brand-teal text-brand-dark shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Libraries</span>
                </button>
              </div>

              {/* Viewport switchers in preview tab */}
              {activeTab === 'preview' && (
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => setPreviewViewport('desktop')}
                    className={`p-1 rounded ${previewViewport === 'desktop' ? 'bg-brand-teal text-brand-dark' : 'text-gray-400 hover:text-white'}`}
                    title="Desktop View (100%)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewViewport('tablet')}
                    className={`p-1 rounded ${previewViewport === 'tablet' ? 'bg-brand-teal text-brand-dark' : 'text-gray-400 hover:text-white'}`}
                    title="Tablet View (768px)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewViewport('mobile')}
                    className={`p-1 rounded ${previewViewport === 'mobile' ? 'bg-brand-teal text-brand-dark' : 'text-gray-400 hover:text-white'}`}
                    title="Mobile View (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Execution Runtime Stats & Controls */}
              {activeTab === 'console' && (
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  {isRunning && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      {isWaitingInput ? 'Waiting for Input...' : 'Running...'}
                    </span>
                  )}

                  {executionStats && !isRunning && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          executionStats.exitCode === 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {executionStats.exitCode === 0 ? 'EXIT 0 (OK)' : `EXIT ${executionStats.exitCode}`}
                      </span>
                      {executionStats.timeMs !== undefined && (
                        <span className="text-gray-400">{executionStats.timeMs}ms</span>
                      )}
                    </div>
                  )}

                  {/* Clear Console Output */}
                  <button
                    onClick={() => {
                      setConsoleOutput('');
                      setStderrOutput(null);
                      setAiDebugResult(null);
                    }}
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
                    title="Clear Terminal Output"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: TERMINAL / CONSOLE OUTPUT */}
            {activeTab === 'console' && (
              <div className="flex-1 flex flex-col bg-[#03060F] min-h-[340px] sm:min-h-[460px] overflow-hidden">
                {/* Scrollable Terminal Output History */}
                <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto font-mono text-xs space-y-3">
                  {/* Stdout stream */}
                  <div className="whitespace-pre-wrap text-emerald-400 leading-relaxed font-mono select-text">
                    {consoleOutput || (isRunning ? 'Starting program execution...' : 'Click "Run Code" to execute.')}
                  </div>

                  {/* Matplotlib Graphical Plot Display */}
                  {plotImageBase64 && (
                    <div className="mt-4 p-3 bg-[#0B0F19] border border-cyan-500/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          Matplotlib Plot Rendered
                        </span>
                        <a
                          href={plotImageBase64}
                          download="scoders_plot.png"
                          className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black rounded-lg text-[10px] font-bold font-mono transition-colors"
                        >
                          Download PNG
                        </a>
                      </div>
                      <div className="flex justify-center p-2 bg-white rounded-lg">
                        <img src={plotImageBase64} alt="Matplotlib Plot" className="max-h-72 object-contain rounded" />
                      </div>
                    </div>
                  )}

                  {/* Stderr / Compiler Error Display */}
                  {stderrOutput && (
                    <div className="mt-3 p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs leading-relaxed">
                      <div className="flex items-center justify-between pb-2 border-b border-red-500/20 mb-2">
                        <div className="flex items-center gap-1.5 font-bold text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>Compiler / Runtime Diagnostic:</span>
                        </div>

                        {/* AI Debug Button */}
                        <button
                          onClick={handleAiDebug}
                          disabled={isAiDebugging}
                          className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500 text-white border border-red-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {isAiDebugging ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Wand2 className="w-3 h-3 text-red-300" />
                          )}
                          <span>{isAiDebugging ? 'Diagnosing with AI...' : '🤖 Debug with AI'}</span>
                        </button>
                      </div>

                      <div className="whitespace-pre-wrap font-mono text-[11px] text-red-200">
                        {stderrOutput}
                      </div>
                    </div>
                  )}

                  {/* AI DEBUGGER DIAGNOSTIC BREAKDOWN & 1-CLICK FIX */}
                  {aiDebugResult && (
                    <div className="mt-3 p-4 bg-[#111927] border border-cyan-500/40 rounded-xl shadow-xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span className="font-display font-bold text-sm text-white">AI Diagnostic & Fix Assistant</span>
                        </div>
                        {aiDebugResult.line && (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                            Line {aiDebugResult.line}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-bold">Error Type</span>
                        <span className="text-red-400 font-bold font-mono text-xs">{aiDebugResult.errorType}</span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-bold">Why This Happened</span>
                        <p className="text-gray-300 text-xs leading-relaxed mt-0.5">{aiDebugResult.explanation}</p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-bold">Suggested Fix</span>
                        <p className="text-cyan-200 text-xs leading-relaxed mt-0.5">{aiDebugResult.suggestedFixSummary}</p>
                      </div>

                      {/* 1-Click Apply Fix Button */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={handleApplyAiFix}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply 1-Click Fix to Code</span>
                        </button>
                        <button
                          onClick={() => setAiDebugResult(null)}
                          className="px-3 py-2 text-gray-400 hover:text-white text-xs font-mono cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Execution Success Stamp */}
                  {executionStats && executionStats.exitCode === 0 && !isRunning && (
                    <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Program executed successfully.
                      </span>
                      <span>Runtime: {executionStats.language || currentLangMeta.name}</span>
                    </div>
                  )}

                  {/* Invisible scroll target */}
                  <div ref={consoleBottomRef} />
                </div>

                {/* DOCKED INTERACTIVE TERMINAL INPUT BAR */}
                <div
                  className={`p-2.5 sm:p-3 border-t transition-all ${
                    isWaitingInput
                      ? 'bg-[#0B1528] border-cyan-500/60 shadow-[0_-4px_20px_rgba(34,211,238,0.15)]'
                      : 'bg-[#060A14] border-white/10'
                  }`}
                >
                  {isWaitingInput && (
                    <div className="flex items-center justify-between mb-2 text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg animate-pulse">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span className="font-bold">Input Required by Program:</span>
                        <span className="text-white truncate max-w-[280px] sm:max-w-[400px]">
                          {waitingPromptText || 'Program is waiting for your input'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 hidden sm:inline">Press Enter ↵ to submit</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-cyan-400 font-mono text-xs font-bold pl-1 shrink-0">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>&gt;</span>
                    </div>

                    <input
                      ref={terminalInputRef}
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          sendTerminalInput();
                        }
                      }}
                      placeholder={
                        isWaitingInput
                          ? '👉 Type your response here and press Enter (or click Send)...'
                          : isRunning
                          ? 'Send input to running program (press Enter to send)...'
                          : 'Interactive terminal input bar (press Enter to submit input to stdin)...'
                      }
                      className={`flex-1 bg-black/60 font-mono text-xs text-white px-3 py-2 rounded-lg outline-none transition-all placeholder:text-gray-500 border ${
                        isWaitingInput
                          ? 'border-cyan-400 ring-2 ring-cyan-400/20'
                          : 'border-white/10 focus:border-cyan-500/50'
                      }`}
                    />

                    <button
                      onClick={sendTerminalInput}
                      disabled={!terminalInput && terminalInput !== '0'}
                      className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-display font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      title="Send input line to running program"
                    >
                      <span className="hidden sm:inline">Send</span>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE UI PREVIEW */}
            <div
              className={`flex-1 bg-[#050811] flex flex-col items-center justify-center p-2 min-h-[340px] sm:min-h-[460px] ${
                activeTab === 'preview' ? 'block' : 'hidden'
              }`}
            >
              <div
                className={`w-full h-full transition-all duration-300 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-[#0B0F17] flex flex-col ${
                  previewViewport === 'mobile'
                    ? 'max-w-[375px] max-h-[667px]'
                    : previewViewport === 'tablet'
                    ? 'max-w-[768px]'
                    : 'max-w-full'
                }`}
              >
                {/* Titlebar */}
                <div className="bg-[#131A29] px-3 py-1.5 border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                    <span className="ml-2 text-gray-300 font-bold">
                      {language === 'react' ? 'React Virtual DOM Sandbox' : language === 'html' ? 'Live Browser Engine' : 'Web Preview'}
                    </span>
                  </div>
                  <button
                    onClick={() => renderWebSandbox(language === 'react' ? 'react' : 'html', code)}
                    className="p-1 hover:text-brand-teal transition-colors"
                    title="Reload Sandbox"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                {/* Sandboxed Iframe */}
                <iframe
                  ref={previewIframeRef}
                  title="S-CODERS Live UI Preview"
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                  className="w-full flex-1 bg-[#0B0F17] border-0 min-h-[320px]"
                />
              </div>
            </div>

            {/* TAB 3: AI TUTOR */}
            {activeTab === 'ai' && (
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-4 bg-[#03060F] min-h-[340px] sm:min-h-[460px]">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span className="font-display font-bold text-sm text-white">S-CODERS AI Code Instructor</span>
                  </div>
                  <button
                    onClick={handleAiExplain}
                    disabled={isAiExplaining}
                    className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {isAiExplaining ? 'Analyzing...' : 'Re-Analyze Code'}
                  </button>
                </div>

                {isAiExplaining ? (
                  <div className="py-12 text-center text-gray-400 space-y-3">
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>AI is reading your program line-by-line...</p>
                  </div>
                ) : aiExplainResult ? (
                  <div className="space-y-4 font-sans">
                    <div className="p-3 bg-[#131A29] border border-white/10 rounded-xl">
                      <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold block mb-1">Executive Summary</span>
                      <p className="text-gray-200 text-xs leading-relaxed">{aiExplainResult.summary}</p>
                    </div>

                    {aiExplainResult.keyConcepts?.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1.5 font-mono">Key Architectural Concepts</span>
                        <div className="flex flex-wrap gap-1.5">
                          {aiExplainResult.keyConcepts.map((concept, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 rounded-lg text-[11px] font-mono">
                              ⚡ {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-2 font-mono">Step-by-Step Breakdown</span>
                      <div className="space-y-2">
                        {aiExplainResult.lineByLine?.map((item, idx) => (
                          <div key={idx} className="p-3 bg-[#0A0F1D] border border-white/5 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-1.5 py-0.5 rounded bg-brand-teal/20 text-brand-teal font-mono text-[10px] font-bold">
                                Lines {item.lines}
                              </span>
                              <span className="text-white font-bold text-xs">{item.title}</span>
                            </div>
                            <p className="text-gray-300 text-xs leading-relaxed">{item.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {aiExplainResult.complexity && (
                      <div className="p-2.5 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400">Computational Characteristics:</span>
                        <span className="text-cyan-300 font-bold">{aiExplainResult.complexity}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-400 space-y-3 font-sans">
                    <BookOpen className="w-10 h-10 text-gray-600 mx-auto" />
                    <p className="text-sm text-gray-300 font-semibold">Want a deep-dive explanation of this code?</p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Click the button below to get an AI breakdown of every line, the algorithm flow, and computational complexity.
                    </p>
                    <button
                      onClick={handleAiExplain}
                      className="px-4 py-2 bg-brand-teal text-brand-dark rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors cursor-pointer"
                    >
                      Explain Code Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: LIBRARIES & PACKAGES INFO */}
            {activeTab === 'packages' && (
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-4 bg-[#03060F] min-h-[340px] sm:min-h-[460px]">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span className="font-display font-bold text-sm text-white">
                      Built-in Libraries: {currentLangMeta.name}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${currentLangMeta.badgeColor}`}>
                    {currentLangMeta.versionLabel}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  The execution environment includes the full standard library and popular production packages pre-configured. You can import and use them directly in your code without extra installations.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentLangMeta.libraries.map((lib, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#111827] border border-white/10 rounded-xl flex items-center justify-between group hover:border-brand-teal/40 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{lib}</div>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <CheckCheck className="w-3 h-3" /> Ready in environment
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-1.5 font-sans">
                  <span className="text-xs font-bold text-cyan-300 block">💡 Need an unlisted package?</span>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Python code will automatically attempt on-the-fly resolution for standard PyPI packages. For web languages, CDN script tags or ESM module imports are supported inside the HTML/React sandbox!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VS CODE BOTTOM STATUS BAR */}
      <div className="bg-[#080D18] border-t border-white/10 px-3 py-1 flex items-center justify-between text-[11px] font-mono text-gray-400 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            {currentLangMeta.name}
          </span>
          <span className="hidden sm:inline text-gray-600">|</span>
          <span className="hidden sm:inline text-gray-400">{currentLangMeta.versionLabel}</span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {executionStats && (
            <span className="text-emerald-400 hidden md:inline">
              ⚡ {executionStats.timeMs}ms
            </span>
          )}
          <span className="text-gray-400">UTF-8</span>
          <span className="text-gray-400">Spaces: {tabSpaces}</span>
          <span className="text-gray-500">{activeFile.name}</span>
        </div>
      </div>
    </div>
  );
};

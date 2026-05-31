# Orchestrator Dashboard

A Next.js-based UI for the Multi-Agent Security Platform that visualizes the complete architecture diagram with real-time workflow execution monitoring.

## 🎯 Overview

This dashboard provides a visual representation of the security remediation workflow, matching the architecture diagram exactly:

1. **GitHub Push Event** → Webhook trigger
2. **GitHub Actions (CI/CD)** → Workflow initiation
3. **Orchestrator** → FastAPI + LangGraph state machine
4. **Phase A (Parallel)**: Scanner + Analysis agents
5. **Phase B (Sequential)**: Resolution → Validation → PR Agent
6. **Pull Request Output** → GitHub PR with fixes

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 📁 Project Structure

```
orchestrator-dashboard/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page (redirects to dashboard)
│   ├── dashboard/                 # Dashboard page
│   ├── workflows/
│   │   ├── page.tsx              # Workflow list
│   │   ├── execute/
│   │   │   └── page.tsx          # Workflow execution (architecture visualization)
│   │   └── [id]/
│   │       └── page.tsx          # Individual workflow details
│   ├── agents/                    # Agent management
│   ├── vulnerabilities/           # Vulnerability dashboard
│   └── pull-requests/             # PR tracking
│
├── components/
│   ├── AppShell.tsx              # Main layout wrapper
│   ├── Navigation.tsx            # Sidebar navigation
│   └── workflow/
│       ├── WorkflowPipeline.tsx  # Main pipeline visualization
│       ├── PipelineStage.tsx     # Individual stage component
│       ├── ParallelStages.tsx    # Phase A parallel execution
│       └── SequentialStages.tsx  # Phase B sequential execution
│
├── styles/
│   └── carbon-theme.scss         # Carbon Design System theme
│
└── public/                        # Static assets
```

## 🎨 Design System

Built with **IBM Carbon Design System** for enterprise-grade UI:

- **Theme**: g100 (Dark theme)
- **Typography**: IBM Plex Sans & IBM Plex Mono
- **Grid**: 8px spacing system
- **Components**: Tiles, Tags, Progress Bars, Accordions, etc.

### Color Palette

```scss
// Security Severity
--security-critical: #da1e28
--security-high: #ff832b
--security-medium: #f1c21b
--security-low: #0f62fe

// Agent Status
--agent-running: #0f62fe
--agent-complete: #24a148
--agent-pending: #8d8d8d
--agent-error: #da1e28
```

## 🔧 Key Features

### 1. Workflow Visualization

The `/workflows/execute` page provides real-time visualization of the architecture:

- **8 Pipeline Stages** matching the diagram exactly
- **Parallel Execution** (Phase A): Scanner + Analysis agents run simultaneously
- **Sequential Execution** (Phase B): Resolution → Validation with retry logic
- **Real-time Progress** indicators and status updates
- **Detailed Logs** for each agent via accordions

### 2. Agent Management

- Registry of all 6 agents (Scanner, Analysis, Resolution, Validation, PR, GitHub Issue)
- Configuration interfaces
- Performance metrics
- Success rate tracking

### 3. Repository Management

- GitHub webhook configuration
- Connected repositories list
- Branch selection
- Workflow triggers

### 4. Vulnerability Dashboard

- CVE ID tracking
- Severity distribution
- Remediation status
- PR links

## 🏗️ Architecture Alignment

### Stage Mapping

| Architecture Stage | Component | Status Indicator |
|-------------------|-----------|------------------|
| 1. GitHub Push | `PipelineStage` | ✓ Complete |
| 2. CI/CD | `PipelineStage` | ✓ Complete |
| 3. Orchestrator | `PipelineStage` | ⟳ Running |
| 4a. Scanner | `ParallelStages` | ⟳ Running |
| 4b. Analysis | `ParallelStages` | ⏸ Waiting |
| 5. Resolution | `SequentialStages` | ⏸ Pending |
| 6. Validation | `SequentialStages` | ⏸ Pending |
| 7. PR Agent | `PipelineStage` | ⏸ Pending |
| 8. PR Output | `PipelineStage` | ⏸ Pending |

### Agent Details

Each agent card shows:
- **Scanner Agent**: Semgrep, Bandit, AST tools + NVD/OSV APIs
- **Analysis Agent**: CVE ID + CVSS score normalization
- **Resolution Agent**: LLM (OpenAI GPT-4) + Chain-of-Thought + ChromaDB
- **Validation Agent**: Correctness, compilation, logic checks + retry (max 3x)
- **PR Agent**: Branch creation, commit, PR generation

## 🔌 Backend Integration

### API Endpoints

```typescript
// Workflow execution
POST /api/workflow/trigger-batch
GET /api/workflow/stream/{workflowId}  // SSE

// Webhook
POST /webhook/github

// Agents
GET /api/agents
POST /api/agents/configure
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## 📊 Mock Data

For development, the dashboard uses mock data located in `public/mock-data/`:

- `workflows-list.json` - Workflow history
- `agents.json` - Agent registry
- `vulnerabilities.json` - Vulnerability findings
- `pull-requests.json` - PR tracking

## 🎯 Development Roadmap

### Phase 1: Core Visualization ✅
- [x] Project setup with Next.js + TypeScript
- [x] Carbon Design System integration
- [x] Navigation and layout
- [x] Workflow pipeline visualization
- [x] Parallel and sequential stage components

### Phase 2: Agent Management (In Progress)
- [ ] Agent registry page
- [ ] Agent configuration forms
- [ ] Agent performance metrics
- [ ] Agent status monitoring

### Phase 3: Real-time Features
- [ ] SSE integration for live updates
- [ ] WebSocket connection for logs
- [ ] Real-time progress tracking
- [ ] Live agent status updates

### Phase 4: Data Integration
- [ ] Backend API integration
- [ ] GitHub webhook setup
- [ ] Repository management
- [ ] Vulnerability tracking

### Phase 5: Polish & Deploy
- [ ] Responsive design testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Production deployment

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 📝 Contributing

1. Follow the Carbon Design System guidelines
2. Use TypeScript for all new files
3. Maintain the 8px grid system
4. Keep components modular and reusable
5. Document complex logic

## 📚 Resources

- [Carbon Design System](https://carbondesignsystem.com/)
- [Carbon React Components](https://react.carbondesignsystem.com/)
- [Carbon Icons](https://www.carbondesignsystem.com/guidelines/icons/library/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🔐 Security

- HttpOnly cookies for session management
- CSRF protection
- Input validation
- Secure API communication

## 📄 License

MIT License - See LICENSE file for details

---

**Status**: 🚧 In Development
**Version**: 1.0.0
**Last Updated**: May 30, 2026

'use client';

import { 
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Button,
  Tag,
  Grid,
  Column,
  Tile,
  ProgressBar,
} from '@carbon/react';
import { Add, Download } from '@carbon/icons-react';

const headers = [
  { key: 'name', header: 'Agent Name' },
  { key: 'status', header: 'Status' },
  { key: 'type', header: 'Type' },
  { key: 'tasks', header: 'Tasks Completed' },
  { key: 'successRate', header: 'Success Rate' },
  { key: 'lastActive', header: 'Last Active' },
];

const rows = [
  {
    id: '1',
    name: 'Data Processor Alpha',
    status: 'active',
    type: 'Processing',
    tasks: 1247,
    successRate: 98.5,
    lastActive: '2 minutes ago',
  },
  {
    id: '2',
    name: 'ML Training Beta',
    status: 'active',
    type: 'Machine Learning',
    tasks: 856,
    successRate: 95.2,
    lastActive: '5 minutes ago',
  },
  {
    id: '3',
    name: 'API Gateway',
    status: 'idle',
    type: 'Integration',
    tasks: 2341,
    successRate: 99.1,
    lastActive: '1 hour ago',
  },
  {
    id: '4',
    name: 'Database Sync',
    status: 'active',
    type: 'Data Management',
    tasks: 3456,
    successRate: 97.8,
    lastActive: '10 minutes ago',
  },
  {
    id: '5',
    name: 'Report Generator',
    status: 'error',
    type: 'Analytics',
    tasks: 567,
    successRate: 89.3,
    lastActive: '3 hours ago',
  },
  {
    id: '6',
    name: 'Notification Service',
    status: 'active',
    type: 'Communication',
    tasks: 4521,
    successRate: 99.7,
    lastActive: '1 minute ago',
  },
];

export default function AgentsPage() {
  const getStatusTag = (status: string) => {
    const statusConfig = {
      active: { type: 'green' as const, label: 'Active' },
      idle: { type: 'gray' as const, label: 'Idle' },
      error: { type: 'red' as const, label: 'Error' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Tag type={config.type} size="sm">{config.label}</Tag>;
  };

  const summary = [
    { label: 'Total Agents', value: '6', color: 'blue' },
    { label: 'Active', value: '4', color: 'green' },
    { label: 'Idle', value: '1', color: 'gray' },
    { label: 'Errors', value: '1', color: 'red' },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 600, 
          marginBottom: '0.5rem',
          color: 'var(--cds-text-primary)',
        }}>
          Agents
        </h1>
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--cds-text-secondary)',
        }}>
          Manage and monitor your autonomous agents
        </p>
      </div>

      {/* Summary Cards */}
      <Grid narrow style={{ marginBottom: '2rem' }}>
        {summary.map((item, index) => (
          <Column key={index} sm={4} md={2} lg={4}>
            <Tile style={{
              textAlign: 'center',
              padding: '1.5rem 1rem',
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 600,
                color: 'var(--cds-text-primary)',
                marginBottom: '0.25rem',
              }}>
                {item.value}
              </div>
              <div style={{ 
                fontSize: '0.875rem',
                color: 'var(--cds-text-secondary)',
              }}>
                {item.label}
              </div>
            </Tile>
          </Column>
        ))}
      </Grid>

      {/* Agents Table */}
      <DataTable rows={rows} headers={headers}>
        {({
          rows,
          headers,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getTableContainerProps,
        }) => (
          <TableContainer
            {...getTableContainerProps()}
            style={{ marginTop: '1rem' }}
          >
            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch 
                  placeholder="Search agents..."
                  persistent
                />
                <Button 
                  kind="secondary" 
                  renderIcon={Download}
                  size="sm"
                >
                  Export
                </Button>
                <Button 
                  kind="primary" 
                  renderIcon={Add}
                  size="sm"
                >
                  Add Agent
                </Button>
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader {...getHeaderProps({ header })} key={header.key}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow {...getRowProps({ row })} key={row.id}>
                    {row.cells.map((cell) => {
                      if (cell.info.header === 'name') {
                        return (
                          <TableCell key={cell.id}>
                            <span style={{ fontWeight: 500 }}>
                              {cell.value}
                            </span>
                          </TableCell>
                        );
                      }
                      
                      if (cell.info.header === 'status') {
                        return (
                          <TableCell key={cell.id}>
                            {getStatusTag(cell.value as string)}
                          </TableCell>
                        );
                      }
                      
                      if (cell.info.header === 'type') {
                        return (
                          <TableCell key={cell.id}>
                            <Tag type="blue" size="sm">
                              {cell.value}
                            </Tag>
                          </TableCell>
                        );
                      }
                      
                      if (cell.info.header === 'tasks') {
                        return (
                          <TableCell key={cell.id}>
                            <span style={{ 
                              fontFamily: 'IBM Plex Mono, monospace',
                              fontSize: '0.875rem',
                            }}>
                              {cell.value?.toLocaleString()}
                            </span>
                          </TableCell>
                        );
                      }
                      
                      if (cell.info.header === 'successRate') {
                        const rate = cell.value as number;
                        return (
                          <TableCell key={cell.id}>
                            <div style={{ minWidth: '120px' }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                marginBottom: '0.25rem',
                              }}>
                                <span style={{ 
                                  fontSize: '0.875rem',
                                  fontWeight: 500,
                                }}>
                                  {rate}%
                                </span>
                              </div>
                              <ProgressBar
                                value={rate}
                                label=""
                              />
                            </div>
                          </TableCell>
                        );
                      }
                      
                      if (cell.info.header === 'lastActive') {
                        return (
                          <TableCell key={cell.id}>
                            <span style={{ 
                              fontSize: '0.875rem',
                              color: 'var(--cds-text-secondary)',
                            }}>
                              {cell.value}
                            </span>
                          </TableCell>
                        );
                      }
                      
                      return <TableCell key={cell.id}>{cell.value}</TableCell>;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </div>
  );
}

// Made with Bob

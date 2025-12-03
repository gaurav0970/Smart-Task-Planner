/**
 * Smart Task Planner Frontend
 * Main application logic for AI-powered task planning
 */

class SmartTaskPlannerApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.currentPlan = null;
        this.planId = null;
        
        this.init();
    }

    init() {
        // Initialize event listeners
        this.initEventListeners();
        
        // Check backend connection
        this.checkBackendConnection();
        
        // Setup character counter
        this.setupCharCounter();
        
        // Load any saved plan from localStorage
        this.loadSavedPlan();
    }

    initEventListeners() {
        // Generate plan button
        document.getElementById('generateBtn').addEventListener('click', () => this.generatePlan());
        
        // Timeline slider
        const timelineSlider = document.getElementById('timelineInput');
        const timelineValue = document.getElementById('timelineValue');
        
        timelineSlider.addEventListener('input', (e) => {
            timelineValue.textContent = e.target.value;
        });
        
        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goal = e.currentTarget.dataset.goal;
                const timeline = e.currentTarget.dataset.timeline;
                
                document.getElementById('goalInput').value = goal;
                document.getElementById('timelineInput').value = timeline;
                document.getElementById('timelineValue').textContent = timeline;
                
                // Update character count
                this.updateCharCounter();
                
                // Generate plan automatically
                this.generatePlan();
            });
        });
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.filterTasks(filter);
                
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
        
        // Export buttons
        document.getElementById('exportJsonBtn')?.addEventListener('click', () => this.exportAsJson());
        document.getElementById('exportTextBtn')?.addEventListener('click', () => this.exportAsText());
        document.getElementById('printBtn')?.addEventListener('click', () => this.printPlan());
        document.getElementById('newPlanBtn')?.addEventListener('click', () => this.resetForm());
        
        // Keyboard shortcut (Ctrl+Enter to generate plan)
        document.getElementById('goalInput').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generatePlan();
            }
        });
    }

    setupCharCounter() {
        const textarea = document.getElementById('goalInput');
        const charCount = document.getElementById('charCount');
        
        textarea.addEventListener('input', () => this.updateCharCounter());
        this.updateCharCounter();
    }

    updateCharCounter() {
        const textarea = document.getElementById('goalInput');
        const charCount = document.getElementById('charCount');
        const count = textarea.value.length;
        
        charCount.textContent = count;
        
        // Visual feedback based on length
        if (count < 10) {
            charCount.style.color = '#f94144'; // Red
        } else if (count < 50) {
            charCount.style.color = '#f8961e'; // Orange
        } else {
            charCount.style.color = '#4cc9f0'; // Green
        }
    }

    async checkBackendConnection() {
        const apiStatus = document.getElementById('apiStatus');
        
        try {
            const response = await fetch('http://localhost:5000/health');
            if (response.ok) {
                apiStatus.innerHTML = '<span style="color: #4cc9f0;">🟢 Backend connected</span>';
                apiStatus.title = 'Backend API is running properly';
            } else {
                throw new Error('Backend returned error');
            }
        } catch (error) {
            apiStatus.innerHTML = '<span style="color: #f8961e;">🟡 Backend offline (using demo mode)</span>';
            apiStatus.title = 'Running in offline demo mode. Some features may be limited.';
        }
    }

    async generatePlan() {
        const goal = document.getElementById('goalInput').value.trim();
        const timeline = parseInt(document.getElementById('timelineInput').value);
        
        // Validate input
        if (!goal) {
            this.showToast('Please enter a goal to plan', 'warning');
            document.getElementById('goalInput').focus();
            return;
        }
        
        if (goal.length < 5) {
            this.showToast('Please provide a more detailed goal (min 5 characters)', 'warning');
            return;
        }
        
        // Show loading animation
        this.showLoading(true);
        
        try {
            // Try to call backend API
            const response = await fetch(`${this.apiBaseUrl}/plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    goal: goal,
                    timeline: timeline
                })
            });
            
            let plan;
            
            if (response.ok) {
                const data = await response.json();
                plan = data.plan;
                this.planId = data.plan_id;
                this.showToast('Plan generated successfully using AI analysis', 'success');
            } else {
                // Fallback to demo mode
                plan = this.generateDemoPlan(goal, timeline);
                this.showToast('Using demo mode (backend offline)', 'warning');
            }
            
            // Store and display the plan
            this.currentPlan = plan;
            this.savePlanToLocalStorage();
            this.displayPlan(plan);
            
        } catch (error) {
            console.error('Error generating plan:', error);
            
            // Use demo data as fallback
            const plan = this.generateDemoPlan(goal, timeline);
            this.currentPlan = plan;
            this.displayPlan(plan);
            
            this.showToast('Using demo mode. Check backend connection.', 'warning');
        } finally {
            this.showLoading(false);
        }
    }

    generateDemoPlan(goal, timeline) {
        // Create a realistic demo plan
        const phases = [
            "Research & Analysis",
            "Planning & Strategy",
            "Execution Phase 1",
            "Execution Phase 2",
            "Testing & Quality Assurance",
            "Launch & Delivery"
        ];
        
        const tasks = [];
        const startDate = new Date();
        let currentDate = new Date(startDate);
        
        // Detect domain based on keywords
        const domain = this.detectDomain(goal);
        
        phases.forEach((phase, phaseIndex) => {
            const tasksInPhase = Math.max(1, Math.ceil(timeline / phases.length));
            
            for (let i = 0; i < tasksInPhase; i++) {
                const taskId = tasks.length;
                const taskDuration = Math.max(1, Math.ceil(timeline / phases.length / tasksInPhase));
                
                // Calculate dates
                const taskStart = new Date(currentDate);
                const taskEnd = new Date(taskStart);
                taskEnd.setDate(taskEnd.getDate() + (taskDuration * 7));
                
                // Determine dependencies
                const dependencies = [];
                if (taskId > 0 && i === 0) {
                    dependencies.push(taskId - 1);
                }
                
                // Determine priority
                let priority;
                if (phaseIndex === 0) priority = 'high';
                else if (phaseIndex < phases.length - 2) priority = 'medium';
                else priority = 'low';
                
                // Create task
                tasks.push({
                    id: taskId,
                    name: `${phase}: Task ${i + 1}`,
                    description: this.generateTaskDescription(goal, phase, i + 1, domain),
                    phase: phase,
                    duration_weeks: taskDuration,
                    start_date: taskStart.toISOString().split('T')[0],
                    end_date: taskEnd.toISOString().split('T')[0],
                    dependencies: dependencies,
                    priority: priority,
                    status: 'pending',
                    assigned_to: this.assignResource(domain, phase),
                    estimated_hours: taskDuration * 20
                });
                
                currentDate = new Date(taskEnd);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
        
        // Calculate critical path (simplified)
        const criticalPath = [];
        if (tasks.length > 0) {
            criticalPath.push(0);
            if (tasks.length > 3) criticalPath.push(Math.floor(tasks.length / 2));
            criticalPath.push(tasks.length - 1);
        }
        
        return {
            goal: goal,
            domain: domain,
            timeline_weeks: timeline,
            total_tasks: tasks.length,
            total_phases: phases.length,
            start_date: startDate.toISOString().split('T')[0],
            end_date: tasks[tasks.length - 1].end_date,
            total_duration_weeks: timeline,
            tasks: tasks,
            critical_path: criticalPath,
            phases: phases,
            generated_at: new Date().toISOString(),
            complexity: this.assessComplexity(goal, tasks.length)
        };
    }

    detectDomain(goal) {
        const goalLower = goal.toLowerCase();
        
        if (goalLower.includes('app') || goalLower.includes('software') || 
            goalLower.includes('website') || goalLower.includes('develop')) {
            return 'software';
        } else if (goalLower.includes('market') || goalLower.includes('campaign') || 
                  goalLower.includes('promote') || goalLower.includes('brand')) {
            return 'marketing';
        } else if (goalLower.includes('event') || goalLower.includes('meeting') || 
                  goalLower.includes('conference') || goalLower.includes('party')) {
            return 'event';
        } else {
            return 'general';
        }
    }

    generateTaskDescription(goal, phase, taskNum, domain) {
        const descriptions = {
            'software': {
                'Research & Analysis': [
                    `Analyze requirements for ${goal}`,
                    `Research technology stack options`,
                    `Study user needs and market gaps`
                ],
                'Planning & Strategy': [
                    `Create technical specifications`,
                    `Design system architecture`,
                    `Plan development milestones`
                ],
                'Execution Phase 1': [
                    `Set up development environment`,
                    `Implement core functionality`,
                    `Create database schema`
                ],
                'Testing & Quality Assurance': [
                    `Write and execute test cases`,
                    `Perform security testing`,
                    `Optimize performance`
                ]
            },
            'marketing': {
                'Research & Analysis': [
                    `Analyze target audience for ${goal}`,
                    `Research competitor strategies`,
                    `Identify market opportunities`
                ],
                'Planning & Strategy': [
                    `Develop marketing strategy`,
                    `Create content calendar`,
                    `Plan campaign budget`
                ]
            }
        };
        
        if (descriptions[domain] && descriptions[domain][phase]) {
            const descList = descriptions[domain][phase];
            return descList[taskNum % descList.length];
        }
        
        // Default descriptions
        const defaultDescs = [
            `Complete ${phase.toLowerCase()} activities`,
            `Work on ${phase.toLowerCase()} deliverables`,
            `Implement ${phase.toLowerCase()} requirements`
        ];
        
        return defaultDescs[taskNum % defaultDescs.length];
    }

    assignResource(domain, phase) {
        const resources = {
            'software': {
                'Research': 'Business Analyst',
                'Planning': 'Project Manager',
                'Execution': 'Development Team',
                'Testing': 'QA Team'
            },
            'marketing': {
                'Research': 'Market Analyst',
                'Planning': 'Marketing Manager',
                'Execution': 'Marketing Team'
            },
            'event': {
                'Research': 'Event Coordinator',
                'Planning': 'Event Manager',
                'Execution': 'Event Team'
            }
        };
        
        if (resources[domain]) {
            for (const [key, value] of Object.entries(resources[domain])) {
                if (phase.includes(key)) {
                    return value;
                }
            }
        }
        
        return 'Project Team';
    }

    assessComplexity(goal, taskCount) {
        if (goal.length > 100 || taskCount > 15) return 'High';
        if (goal.length > 50 || taskCount > 8) return 'Medium';
        return 'Low';
    }

    displayPlan(plan) {
        // Update plan summary
        this.updatePlanSummary(plan);
        
        // Display tasks
        this.displayTasks(plan.tasks);
        
        // Display timeline
        this.displayTimeline(plan.tasks);
        
        // Display dependencies
        this.displayDependencies(plan.tasks);
        
        // Show results section
        document.getElementById('resultsSection').style.display = 'block';
        
        // Scroll to results
        setTimeout(() => {
            document.getElementById('resultsSection').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 300);
    }

    updatePlanSummary(plan) {
        document.getElementById('summaryGoal').textContent = plan.goal;
        document.getElementById('summaryDomain').textContent = `Domain: ${plan.domain.charAt(0).toUpperCase() + plan.domain.slice(1)}`;
        
        document.getElementById('statTasks').textContent = plan.total_tasks;
        document.getElementById('statTimeline').textContent = plan.timeline_weeks;
        document.getElementById('statStart').textContent = this.formatDate(plan.start_date);
        document.getElementById('statEnd').textContent = this.formatDate(plan.end_date);
        document.getElementById('statComplexity').textContent = plan.complexity;
    }

    displayTasks(tasks) {
        const container = document.getElementById('tasksContainer');
        
        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks generated</div>';
            return;
        }
        
        const tasksHtml = tasks.map(task => `
            <div class="task-card ${task.priority}" data-task-id="${task.id}" data-priority="${task.priority}">
                <div class="task-header">
                    <div class="task-title">${task.name}</div>
                    <div class="task-priority">
                        <span class="priority-badge ${task.priority}">${task.priority.toUpperCase()}</span>
                    </div>
                </div>
                <p class="task-description">${task.description}</p>
                <div class="task-meta">
                    <div class="meta-item">
                        <i class="far fa-calendar"></i>
                        ${this.formatDate(task.start_date)} → ${this.formatDate(task.end_date)}
                    </div>
                    <div class="meta-item">
                        <i class="far fa-clock"></i>
                        ${task.duration_weeks} week${task.duration_weeks > 1 ? 's' : ''}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-user"></i>
                        ${task.assigned_to}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-link"></i>
                        ${task.dependencies.length > 0 ? 
                          `Depends on: ${task.dependencies.map(d => `Task ${d + 1}`).join(', ')}` : 
                          'No dependencies'}
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = tasksHtml;
        
        // Add click handlers to task cards
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.task-priority')) {
                    const taskId = card.dataset.taskId;
                    this.showTaskDetails(parseInt(taskId));
                }
            });
        });
    }

    filterTasks(filter) {
        const taskCards = document.querySelectorAll('.task-card');
        
        taskCards.forEach(card => {
            if (filter === 'all' || card.dataset.priority === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    displayTimeline(tasks) {
        const container = document.getElementById('timelineContainer');
        
        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No timeline data available</div>';
            return;
        }
        
        // Calculate timeline dimensions
        const startDate = new Date(tasks[0].start_date);
        const endDate = new Date(tasks[tasks.length - 1].end_date);
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Create timeline bar
        let timelineHtml = '<div class="timeline-bar">';
        
        tasks.forEach((task, index) => {
            const taskStart = new Date(task.start_date);
            const taskEnd = new Date(task.end_date);
            
            const daysFromStart = Math.ceil((taskStart - startDate) / (1000 * 60 * 60 * 24));
            const taskDuration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24));
            
            const leftPercent = (daysFromStart / totalDays) * 100;
            const widthPercent = (taskDuration / totalDays) * 100;
            
            timelineHtml += `
                <div class="timeline-segment" 
                     style="left: ${leftPercent}%; width: ${widthPercent}%;"
                     title="${task.name} (${task.duration_weeks} week${task.duration_weeks > 1 ? 's' : ''})"
                     data-task-index="${index}">
                    ${index + 1}
                </div>
            `;
        });
        
        timelineHtml += '</div>';
        
        // Add date labels
        timelineHtml += `
            <div class="timeline-labels">
                <span>${this.formatDate(startDate)}</span>
                <span>${this.formatDate(endDate)}</span>
            </div>
        `;
        
        container.innerHTML = timelineHtml;
        
        // Add click handlers to timeline segments
        document.querySelectorAll('.timeline-segment').forEach(segment => {
            segment.addEventListener('click', (e) => {
                const taskIndex = parseInt(e.currentTarget.dataset.taskIndex);
                this.showTaskDetails(taskIndex);
            });
        });
    }

    displayDependencies(tasks) {
        const container = document.getElementById('dependenciesContainer');
        
        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No dependencies to display</div>';
            return;
        }
        
        // Simple dependency visualization
        let depsHtml = '<div class="dependencies-flow">';
        
        tasks.forEach((task, index) => {
            depsHtml += `
                <div class="dependency-node" data-task-id="${index}">
                    Task ${index + 1}
                    ${task.dependencies.length > 0 ? 
                      `<div class="dependency-arrow">← ${task.dependencies.map(d => d + 1).join(', ')}</div>` : 
                      ''}
                </div>
            `;
        });
        
        depsHtml += '</div>';
        container.innerHTML = depsHtml;
        
        // Add click handlers
        document.querySelectorAll('.dependency-node').forEach(node => {
            node.addEventListener('click', (e) => {
                const taskId = parseInt(e.currentTarget.dataset.taskId);
                this.showTaskDetails(taskId);
            });
        });
    }

    showTaskDetails(taskId) {
        if (!this.currentPlan || !this.currentPlan.tasks[taskId]) {
            return;
        }
        
        const task = this.currentPlan.tasks[taskId];
        
        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${task.name}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Description:</strong> ${task.description}</p>
                        <div class="task-details-grid">
                            <div class="detail-item">
                                <strong>Phase:</strong> ${task.phase}
                            </div>
                            <div class="detail-item">
                                <strong>Duration:</strong> ${task.duration_weeks} week${task.duration_weeks > 1 ? 's' : ''}
                            </div>
                            <div class="detail-item">
                                <strong>Start Date:</strong> ${this.formatDate(task.start_date)}
                            </div>
                            <div class="detail-item">
                                <strong>End Date:</strong> ${this.formatDate(task.end_date)}
                            </div>
                            <div class="detail-item">
                                <strong>Priority:</strong> <span class="priority-badge ${task.priority}">${task.priority.toUpperCase()}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Assigned To:</strong> ${task.assigned_to}
                            </div>
                            <div class="detail-item">
                                <strong>Estimated Hours:</strong> ${task.estimated_hours} hours
                            </div>
                            <div class="detail-item">
                                <strong>Dependencies:</strong> ${task.dependencies.length > 0 ? 
                                  task.dependencies.map(d => `Task ${d + 1}`).join(', ') : 
                                  'None'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Create modal
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Add modal styles
        this.addModalStyles();
        
        // Add close handler
        modalContainer.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
        
        // Close when clicking outside
        modalContainer.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                document.body.removeChild(modalContainer);
            }
        });
    }

    addModalStyles() {
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                }
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-header h3 {
                    margin: 0;
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6c757d;
                }
                .modal-close:hover {
                    color: #212529;
                }
                .modal-body {
                    padding: 1.5rem;
                }
                .task-details-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .detail-item {
                    padding: 0.5rem;
                    background: #f8f9fa;
                    border-radius: 6px;
                }
                .priority-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .priority-badge.high { background: #f94144; color: white; }
                .priority-badge.medium { background: #f8961e; color: white; }
                .priority-badge.low { background: #4cc9f0; color: white; }
            `;
            document.head.appendChild(style);
        }
    }

    exportAsJson() {
        if (!this.currentPlan) {
            this.showToast('No plan to export', 'warning');
            return;
        }
        
        const dataStr = JSON.stringify(this.currentPlan, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `task-plan-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showToast('Plan exported as JSON file', 'success');
    }

    exportAsText() {
        if (!this.currentPlan) {
            this.showToast('No plan to export', 'warning');
            return;
        }
        
        let text = `SMART TASK PLAN\n`;
        text += `===============\n\n`;
        text += `Goal: ${this.currentPlan.goal}\n`;
        text += `Timeline: ${this.currentPlan.timeline_weeks} weeks\n`;
        text += `Start Date: ${this.currentPlan.start_date}\n`;
        text += `End Date: ${this.currentPlan.end_date}\n`;
        text += `Total Tasks: ${this.currentPlan.total_tasks}\n`;
        text += `Complexity: ${this.currentPlan.complexity}\n\n`;
        
        text += `TASKS\n`;
        text += `=====\n\n`;
        
        this.currentPlan.tasks.forEach((task, index) => {
            text += `${index + 1}. ${task.name}\n`;
            text += `   Description: ${task.description}\n`;
            text += `   Duration: ${task.duration_weeks} week${task.duration_weeks > 1 ? 's' : ''}\n`;
            text += `   Dates: ${task.start_date} to ${task.end_date}\n`;
            text += `   Priority: ${task.priority.toUpperCase()}\n`;
            text += `   Assigned to: ${task.assigned_to}\n`;
            text += `   Dependencies: ${task.dependencies.length > 0 ? 
                     task.dependencies.map(d => d + 1).join(', ') : 'None'}\n\n`;
        });
        
        const dataBlob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `task-plan-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showToast('Plan exported as text file', 'success');
    }

    printPlan() {
        if (!this.currentPlan) {
            this.showToast('No plan to print', 'warning');
            return;
        }
        
        // Create printable content
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Task Plan: ${this.currentPlan.goal}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 2rem; }
                        h1 { color: #333; border-bottom: 2px solid #4361ee; padding-bottom: 0.5rem; }
                        h2 { color: #555; margin-top: 2rem; }
                        .task { border: 1px solid #ddd; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
                        .task-header { display: flex; justify-content: space-between; }
                        .priority { padding: 0.25rem 0.5rem; border-radius: 4px; color: white; }
                        .priority-high { background: #f94144; }
                        .priority-medium { background: #f8961e; }
                        .priority-low { background: #4cc9f0; }
                        .meta { font-size: 0.9rem; color: #666; margin-top: 0.5rem; }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Smart Task Plan</h1>
                    <div class="summary">
                        <p><strong>Goal:</strong> ${this.currentPlan.goal}</p>
                        <p><strong>Timeline:</strong> ${this.currentPlan.timeline_weeks} weeks</p>
                        <p><strong>Start Date:</strong> ${this.currentPlan.start_date}</p>
                        <p><strong>End Date:</strong> ${this.currentPlan.end_date}</p>
                        <p><strong>Total Tasks:</strong> ${this.currentPlan.total_tasks}</p>
                    </div>
                    
                    <h2>Task Breakdown</h2>
                    ${this.currentPlan.tasks.map((task, index) => `
                        <div class="task">
                            <div class="task-header">
                                <h3>Task ${index + 1}: ${task.name}</h3>
                                <span class="priority priority-${task.priority}">${task.priority.toUpperCase()}</span>
                            </div>
                            <p>${task.description}</p>
                            <div class="meta">
                                <strong>Duration:</strong> ${task.duration_weeks} week${task.duration_weeks > 1 ? 's' : ''} | 
                                <strong>Dates:</strong> ${task.start_date} to ${task.end_date} | 
                                <strong>Assigned to:</strong> ${task.assigned_to} | 
                                <strong>Dependencies:</strong> ${task.dependencies.length > 0 ? task.dependencies.map(d => d + 1).join(', ') : 'None'}
                            </div>
                        </div>
                    `).join('')}
                    
                    <div class="no-print">
                        <p><em>Generated by Smart Task Planner on ${new Date().toLocaleDateString()}</em></p>
                    </div>
                    
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() {
                                window.close();
                            }, 1000);
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    resetForm() {
        document.getElementById('goalInput').value = '';
        document.getElementById('timelineInput').value = '8';
        document.getElementById('timelineValue').textContent = '8';
        document.getElementById('resultsSection').style.display = 'none';
        
        // Reset filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
        
        // Update character counter
        this.updateCharCounter();
        
        // Clear current plan
        this.currentPlan = null;
        localStorage.removeItem('smartTaskPlanner_lastPlan');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.showToast('Form reset. Ready for new goal.', 'success');
    }

    showLoading(show) {
        const loadingSection = document.getElementById('loadingSection');
        const inputSection = document.querySelector('.input-section');
        const resultsSection = document.getElementById('resultsSection');
        
        if (show) {
            loadingSection.style.display = 'block';
            inputSection.style.opacity = '0.5';
            inputSection.style.pointerEvents = 'none';
            resultsSection.style.display = 'none';
            
            // Animate progress bar
            this.animateProgressBar();
            
            // Animate steps
            this.animateLoadingSteps();
        } else {
            loadingSection.style.display = 'none';
            inputSection.style.opacity = '1';
            inputSection.style.pointerEvents = 'auto';
        }
    }

    animateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        let width = 0;
        
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
            } else {
                width += 10;
                progressBar.style.width = width + '%';
            }
        }, 200);
    }

    animateLoadingSteps() {
        const steps = document.querySelectorAll('.loading-steps .step');
        let currentStep = 0;
        
        const interval = setInterval(() => {
            // Remove active class from all steps
            steps.forEach(step => step.classList.remove('active'));
            
            // Add active class to current step
            if (currentStep < steps.length) {
                steps[currentStep].classList.add('active');
                currentStep++;
            } else {
                clearInterval(interval);
            }
        }, 500);
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    savePlanToLocalStorage() {
        if (this.currentPlan) {
            localStorage.setItem('smartTaskPlanner_lastPlan', JSON.stringify({
                plan: this.currentPlan,
                timestamp: new Date().toISOString()
            }));
        }
    }

    loadSavedPlan() {
        try {
            const saved = localStorage.getItem('smartTaskPlanner_lastPlan');
            if (saved) {
                const { plan, timestamp } = JSON.parse(saved);
                
                // Only load if less than 24 hours old
                const savedTime = new Date(timestamp);
                const now = new Date();
                const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.currentPlan = plan;
                    
                    // Populate form with saved data
                    document.getElementById('goalInput').value = plan.goal;
                    document.getElementById('timelineInput').value = plan.timeline_weeks;
                    document.getElementById('timelineValue').textContent = plan.timeline_weeks;
                    
                    // Display the plan
                    this.displayPlan(plan);
                    
                    this.showToast('Loaded your last plan from today', 'info');
                }
            }
        } catch (error) {
            console.error('Error loading saved plan:', error);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SmartTaskPlannerApp();
});
"""
Smart Task Planner Backend API
AI-powered task breakdown with dependencies and timelines
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Store generated plans (simple in-memory database)
task_plans = {}
plan_counter = 1

class SmartTaskPlanner:
    """AI-powered task planning engine"""
    
    def __init__(self):
        # Knowledge base for different types of goals
        self.domain_knowledge = {
            "software": {
                "phases": [
                    "Requirements Gathering",
                    "System Design",
                    "Development",
                    "Testing",
                    "Deployment",
                    "Maintenance"
                ],
                "task_templates": {
                    "Requirements Gathering": [
                        "Define project scope",
                        "Identify stakeholders",
                        "Create user stories",
                        "Document requirements"
                    ],
                    "Development": [
                        "Set up development environment",
                        "Implement core features",
                        "Write unit tests",
                        "Code review"
                    ]
                }
            },
            "marketing": {
                "phases": [
                    "Market Research",
                    "Strategy Development",
                    "Content Creation",
                    "Campaign Execution",
                    "Performance Analysis"
                ]
            },
            "event": {
                "phases": [
                    "Concept Development",
                    "Planning",
                    "Promotion",
                    "Execution",
                    "Post-Event Analysis"
                ]
            }
        }
    
    def detect_domain(self, goal_text):
        """Detect the domain of the goal based on keywords"""
        goal_lower = goal_text.lower()
        
        if any(word in goal_lower for word in ['app', 'software', 'website', 'develop', 'code', 'program']):
            return "software"
        elif any(word in goal_lower for word in ['market', 'campaign', 'promote', 'advertise', 'brand']):
            return "marketing"
        elif any(word in goal_lower for word in ['event', 'meeting', 'conference', 'workshop', 'party']):
            return "event"
        else:
            return "general"
    
    def estimate_task_duration(self, task_complexity, total_timeline):
        """Estimate task duration based on complexity"""
        # Complexity: 1 (simple) to 5 (complex)
        base_duration = total_timeline / 10  # Base duration as percentage of total timeline
        return max(1, round(base_duration * task_complexity))
    
    def generate_dependencies(self, task_index, total_tasks):
        """Generate realistic dependencies between tasks"""
        dependencies = []
        if task_index > 0:
            # Most tasks depend on the previous one
            dependencies.append(task_index - 1)
            # Some tasks might have multiple dependencies
            if task_index >= 3 and task_index % 2 == 0:
                dependencies.append(task_index - 2)
        return dependencies
    
    def break_down_goal(self, goal_text, timeline_weeks):
        """
        Main AI reasoning function to break down goals into tasks
        """
        # Step 1: Analyze the goal
        domain = self.detect_domain(goal_text)
        
        # Step 2: Determine appropriate phases
        if domain in self.domain_knowledge:
            phases = self.domain_knowledge[domain]["phases"]
        else:
            # Default phases for general goals
            phases = [
                "Research & Analysis",
                "Planning",
                "Execution",
                "Review & Testing",
                "Launch & Delivery"
            ]
        
        # Step 3: Generate tasks for each phase
        tasks = []
        start_date = datetime.now()
        current_date = start_date
        
        for phase_idx, phase in enumerate(phases):
            # Determine number of tasks for this phase (1-3 tasks per phase)
            tasks_per_phase = min(3, max(1, timeline_weeks // len(phases)))
            
            for task_idx in range(tasks_per_phase):
                task_num = len(tasks)
                
                # Generate task details
                task_name = f"{phase}: Task {task_idx + 1}"
                
                # Estimate duration (1-3 weeks per task, proportional to total timeline)
                max_task_duration = max(1, timeline_weeks // len(phases))
                duration_weeks = max(1, min(max_task_duration, 
                                          (task_idx + 1) * max_task_duration // tasks_per_phase))
                
                # Calculate dates
                if task_num > 0:
                    # Task starts after its dependencies
                    latest_dep_end = max([tasks[dep]["end_date"] for dep in self.generate_dependencies(task_num, len(phases)*tasks_per_phase)])
                    task_start = latest_dep_end + timedelta(days=1)
                else:
                    task_start = current_date
                
                task_end = task_start + timedelta(weeks=duration_weeks)
                
                # Generate dependencies
                dependencies = self.generate_dependencies(task_num, len(phases)*tasks_per_phase)
                
                # Determine priority
                if phase_idx == 0:
                    priority = "high"
                elif phase_idx == len(phases) - 1:
                    priority = "medium"
                else:
                    priority = "low"
                
                # Create task object
                task = {
                    "id": task_num,
                    "name": task_name,
                    "description": self.generate_task_description(goal_text, phase, task_idx + 1),
                    "phase": phase,
                    "duration_weeks": duration_weeks,
                    "start_date": task_start.strftime("%Y-%m-%d"),
                    "end_date": task_end.strftime("%Y-%m-%d"),
                    "dependencies": dependencies,
                    "priority": priority,
                    "status": "pending",
                    "assigned_to": self.assign_resource(domain, phase),
                    "estimated_hours": duration_weeks * 20  # Rough estimate
                }
                
                tasks.append(task)
                current_date = task_end
        
        # Step 4: Calculate project metrics
        total_duration = sum(task["duration_weeks"] for task in tasks)
        critical_path = self.calculate_critical_path(tasks)
        
        # Step 5: Return complete plan
        return {
            "goal": goal_text,
            "domain": domain,
            "timeline_weeks": timeline_weeks,
            "total_tasks": len(tasks),
            "total_phases": len(phases),
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": tasks[-1]["end_date"] if tasks else start_date.strftime("%Y-%m-%d"),
            "total_duration_weeks": total_duration,
            "tasks": tasks,
            "critical_path": critical_path,
            "phases": phases,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "complexity": self.assess_complexity(goal_text, len(tasks))
        }
    
    def generate_task_description(self, goal, phase, task_num):
        """Generate descriptive task description"""
        descriptions = {
            "Research & Analysis": [
                f"Conduct market research for {goal}",
                f"Analyze requirements and constraints",
                f"Study competitors and market trends"
            ],
            "Planning": [
                f"Create project plan for {goal}",
                f"Define milestones and deliverables",
                f"Allocate resources and budget"
            ],
            "Execution": [
                f"Implement phase {task_num} of {goal}",
                f"Develop core components",
                f"Build and integrate features"
            ],
            "Testing": [
                f"Test functionality and performance",
                f"Conduct quality assurance",
                f"Validate against requirements"
            ]
        }
        
        for key, desc_list in descriptions.items():
            if key in phase:
                return desc_list[task_num % len(desc_list)]
        
        return f"Complete {phase.lower()} task {task_num} for {goal}"
    
    def assign_resource(self, domain, phase):
        """Assign appropriate resources based on domain and phase"""
        resource_map = {
            "software": {
                "Requirements": "Business Analyst",
                "Design": "UX Designer",
                "Development": "Development Team",
                "Testing": "QA Team",
                "Deployment": "DevOps Engineer"
            },
            "marketing": {
                "Research": "Market Analyst",
                "Strategy": "Marketing Manager",
                "Content": "Content Team",
                "Execution": "Campaign Team"
            }
        }
        
        if domain in resource_map:
            for key, resource in resource_map[domain].items():
                if key in phase:
                    return resource
        
        return "Project Team"
    
    def calculate_critical_path(self, tasks):
        """Calculate critical path for the project"""
        if not tasks:
            return []
        
        # Simple critical path calculation
        critical_tasks = []
        current_end_date = None
        
        for task in sorted(tasks, key=lambda x: x["end_date"], reverse=True):
            if not critical_tasks:
                critical_tasks.append(task["id"])
                current_end_date = datetime.strptime(task["end_date"], "%Y-%m-%d")
            else:
                task_start = datetime.strptime(task["start_date"], "%Y-%m-%d")
                if task_start < current_end_date:
                    critical_tasks.append(task["id"])
                    current_end_date = datetime.strptime(task["end_date"], "%Y-%m-%d")
        
        return list(reversed(critical_tasks))
    
    def assess_complexity(self, goal_text, task_count):
        """Assess project complexity"""
        word_count = len(goal_text.split())
        if word_count > 15 or task_count > 10:
            return "high"
        elif word_count > 8 or task_count > 6:
            return "medium"
        else:
            return "low"

# Initialize the planner
planner = SmartTaskPlanner()

# API Routes
@app.route('/')
def home():
    """Home endpoint - API information"""
    return jsonify({
        "message": "Smart Task Planner API",
        "version": "1.0.0",
        "endpoints": {
            "POST /api/plan": "Generate task plan from goal",
            "GET /api/plans": "Get all generated plans",
            "GET /api/plans/<id>": "Get specific plan",
            "GET /health": "Health check"
        }
    })

@app.route('/api/plan', methods=['POST'])
def generate_plan():
    """
    Generate a task plan from a goal
    Expected JSON: {"goal": "string", "timeline": number}
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        goal = data.get('goal', '').strip()
        timeline = data.get('timeline', 4)  # Default 4 weeks
        
        # Validate input
        if not goal:
            return jsonify({"error": "Goal is required"}), 400
        
        if not isinstance(timeline, (int, float)) or timeline <= 0:
            return jsonify({"error": "Timeline must be a positive number"}), 400
        
        # Generate plan using AI reasoning
        plan = planner.break_down_goal(goal, int(timeline))
        
        # Store plan
        global plan_counter, task_plans
        plan_id = str(plan_counter)
        task_plans[plan_id] = plan
        plan_counter += 1
        
        # Return success response
        return jsonify({
            "success": True,
            "message": "Task plan generated successfully",
            "plan_id": plan_id,
            "plan": plan
        })
        
    except Exception as e:
        return jsonify({
            "error": "Failed to generate plan",
            "details": str(e)
        }), 500

@app.route('/api/plans', methods=['GET'])
def get_all_plans():
    """Get all generated plans"""
    return jsonify({
        "success": True,
        "count": len(task_plans),
        "plans": task_plans
    })

@app.route('/api/plans/<plan_id>', methods=['GET'])
def get_plan(plan_id):
    """Get a specific plan by ID"""
    if plan_id in task_plans:
        return jsonify({
            "success": True,
            "plan": task_plans[plan_id]
        })
    return jsonify({"error": "Plan not found"}), 404

@app.route('/api/sample', methods=['GET'])
def get_sample_plan():
    """Get a sample plan for demonstration"""
    sample_goal = "Launch a mobile app for fitness tracking"
    sample_timeline = 8
    
    plan = planner.break_down_goal(sample_goal, sample_timeline)
    
    return jsonify({
        "success": True,
        "message": "Sample plan generated",
        "plan": plan
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Smart Task Planner API",
        "plans_stored": len(task_plans)
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_complexity():
    """Analyze goal complexity without full planning"""
    data = request.get_json()
    goal = data.get('goal', '')
    
    if not goal:
        return jsonify({"error": "Goal is required"}), 400
    
    domain = planner.detect_domain(goal)
    word_count = len(goal.split())
    
    return jsonify({
        "goal": goal,
        "domain": domain,
        "word_count": word_count,
        "estimated_tasks": min(15, max(3, word_count // 2)),
        "complexity": planner.assess_complexity(goal, word_count // 2)
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Run the application
    print(f"🚀 Starting Smart Task Planner API on http://localhost:{port}")
    print(f"📋 API Documentation: http://localhost:{port}/")
    print(f"❤️  Health Check: http://localhost:{port}/health")
    print(f"🛠️  Sample Plan: http://localhost:{port}/api/sample")
    
    app.run(host='0.0.0.0', port=port, debug=True)
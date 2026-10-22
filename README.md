# 🔍 Querify (QueryFile)
### Text-to-SQL with an Intelligent Clarification Engine

**Querify** is a production-oriented enterprise backend built with **Spring Boot 3** and **Java 21** that bridges the gap between natural language and database execution. Instead of blindly guessing ambiguous queries, Querify triggers an intelligent clarification workflow, validates SQL with strict security controls, and returns frontend-ready results complete with business insights and visualization hints.

---

## 🚀 Core Features

1. **Intelligent Clarification Engine:** Detects underspecified or ambiguous user prompts (e.g., "Show sales") and interactively asks clarifying follow-up questions with structured options before generating SQL.
2. **Multi-Turn Context Preservation:** Retains conversation state and intent across multiple request turns.
3. **Bulletproof SQL Security Guard:** Uncompromising security checks that strictly allow only single `SELECT` statements, instantly blocking semicolons, comments, and any write/destructive operations (`DROP`, `DELETE`, `UPDATE`, `INSERT`).
4. **Read-Only Enterprise Execution:** Configured via HikariCP with strict read-only connections, auto-appended row limits, and query timeouts.
5. **Rich Analytics Payload:** Returns raw rows along with auto-generated plain-English business summaries (`businessInsight`) and chart visualization metadata (`chartHint`).

---

## 🛠️ Tech Stack

* **Backend:** Java 21, Spring Boot 3, Spring JDBC / JPA
* **Database:** H2 / SQLite / PostgreSQL (Configurable)
* **Architecture:** RESTful API with Global Exception Handling

---

## ⚙️ Getting Started

### Prerequisites
* Java 21 installed
* Maven 3.9+ installed

### Running Locally
1. Clone the repository:
   ```bash
   git clone [https://github.com/UICipher/querify.git](https://github.com/UICipher/querify.git)
   cd querify

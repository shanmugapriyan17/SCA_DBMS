/**
 * Enhanced Seed — 24 career-role assessments, 240 questions
 * Run: node database/seed/seed-enhanced.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Skill, Question, Assessment, Career, User } = require('../../src/models');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_career_db';

// ─── Career → Skills mapping ───────────────────────────────────────────
const CAREER_SKILL_MAP = {
  'Data Scientist':       ['Python','Machine Learning','SQL','Statistics','Data Analysis'],
  'Full Stack Developer': ['JavaScript','React','Node.js','MongoDB','SQL'],
  'Frontend Developer':   ['JavaScript','React','Git'],
  'Backend Developer':    ['Python','SQL','API Development','Git'],
  'Data Analyst':         ['SQL','Data Analysis','Statistics','Python'],
  'ML Engineer':          ['Python','Machine Learning','Docker'],
  'DevOps Engineer':      ['Docker','AWS','Git'],
  'Database Administrator':['SQL','MongoDB'],
};

// ─── Assessment definitions (8 careers × 3 levels = 24) ───────────────
const ASSESSMENTS = [
  // DATA SCIENTIST
  { career_role:'Data Scientist', difficulty:'beginner',     title:'Data Science Foundations',        description:'Core concepts of data science: Python basics, statistics, and data types.',         time_limit:15 },
  { career_role:'Data Scientist', difficulty:'intermediate', title:'Data Science Practitioner',       description:'Applied ML algorithms, data wrangling, and feature engineering.',                   time_limit:20 },
  { career_role:'Data Scientist', difficulty:'advanced',     title:'Data Science Expert',             description:'Deep learning, model deployment, and advanced statistical modeling.',               time_limit:25 },
  // FULL STACK
  { career_role:'Full Stack Developer', difficulty:'beginner',     title:'Full Stack Basics',         description:'HTML, CSS, JavaScript fundamentals and REST API concepts.',                        time_limit:15 },
  { career_role:'Full Stack Developer', difficulty:'intermediate', title:'Full Stack Practitioner',   description:'React, Node.js, MongoDB CRUD operations, and authentication.',                     time_limit:20 },
  { career_role:'Full Stack Developer', difficulty:'advanced',     title:'Full Stack Expert',         description:'System design, microservices, performance optimization, Docker.',                  time_limit:25 },
  // FRONTEND
  { career_role:'Frontend Developer', difficulty:'beginner',     title:'Frontend Foundations',        description:'HTML semantics, CSS layout, basic JavaScript DOM manipulation.',                   time_limit:12 },
  { career_role:'Frontend Developer', difficulty:'intermediate', title:'Frontend Practitioner',       description:'React hooks, state management, responsive design, API integration.',               time_limit:18 },
  { career_role:'Frontend Developer', difficulty:'advanced',     title:'Frontend Expert',             description:'Performance tuning, accessibility, testing, advanced React patterns.',             time_limit:22 },
  // BACKEND
  { career_role:'Backend Developer', difficulty:'beginner',     title:'Backend Foundations',          description:'Server concepts, HTTP, REST APIs, basic SQL queries.',                            time_limit:15 },
  { career_role:'Backend Developer', difficulty:'intermediate', title:'Backend Practitioner',         description:'Authentication, database design, middleware, error handling.',                     time_limit:20 },
  { career_role:'Backend Developer', difficulty:'advanced',     title:'Backend Expert',               description:'Scalability, caching, message queues, security best practices.',                  time_limit:25 },
  // DATA ANALYST
  { career_role:'Data Analyst', difficulty:'beginner',     title:'Data Analytics Foundations',        description:'SQL basics, data types, simple aggregations, and chart reading.',                  time_limit:12 },
  { career_role:'Data Analyst', difficulty:'intermediate', title:'Data Analytics Practitioner',       description:'Advanced SQL, pivot tables, statistical analysis, visualization.',                 time_limit:18 },
  { career_role:'Data Analyst', difficulty:'advanced',     title:'Data Analytics Expert',             description:'Predictive analytics, A/B testing, complex SQL, Python pandas.',                  time_limit:22 },
  // ML ENGINEER
  { career_role:'ML Engineer', difficulty:'beginner',     title:'ML Engineering Foundations',         description:'ML pipeline concepts, Python, data preprocessing basics.',                        time_limit:15 },
  { career_role:'ML Engineer', difficulty:'intermediate', title:'ML Engineering Practitioner',        description:'Model training, evaluation metrics, hyperparameter tuning.',                       time_limit:20 },
  { career_role:'ML Engineer', difficulty:'advanced',     title:'ML Engineering Expert',              description:'MLOps, model serving, Docker, monitoring and retraining pipelines.',              time_limit:25 },
  // DEVOPS
  { career_role:'DevOps Engineer', difficulty:'beginner',     title:'DevOps Foundations',             description:'Linux basics, version control, CI/CD concepts, containers intro.',                time_limit:15 },
  { career_role:'DevOps Engineer', difficulty:'intermediate', title:'DevOps Practitioner',            description:'Docker, Kubernetes basics, GitHub Actions, cloud services.',                      time_limit:20 },
  { career_role:'DevOps Engineer', difficulty:'advanced',     title:'DevOps Expert',                  description:'Infrastructure as code, monitoring, scaling, security in pipelines.',             time_limit:25 },
  // DBA
  { career_role:'Database Administrator', difficulty:'beginner',     title:'DBA Foundations',         description:'Relational concepts, basic SQL, data integrity, normalization.',                  time_limit:12 },
  { career_role:'Database Administrator', difficulty:'intermediate', title:'DBA Practitioner',        description:'Indexing, query optimization, transactions, backup strategies.',                  time_limit:18 },
  { career_role:'Database Administrator', difficulty:'advanced',     title:'DBA Expert',              description:'Performance tuning, replication, sharding, NoSQL vs SQL trade-offs.',             time_limit:22 },
];

// ─── 10 Questions per assessment (difficulty-aware) ─────────────────────
function makeQuestions(skillId, skillName, difficulty) {
  const diff = { beginner:1, intermediate:3, advanced:5 }[difficulty] || 1;
  const sets = {
    Python: [
      { c:'What does `len([1,2,3])` return?',  o:['2','3','4','1'], a:'B', e:'len() returns element count.' },
      { c:'Which keyword defines a function in Python?', o:['func','def','function','lambda'], a:'B', e:'def is used to define functions.' },
      { c:'What is the output of `type(3.14)`?', o:['int','str','float','number'], a:'C', e:'3.14 is a float literal.' },
      { c:'Which data structure uses key-value pairs?', o:['List','Tuple','Set','Dictionary'], a:'D', e:'Dictionaries store key-value pairs.' },
      { c:'What does `range(3)` produce?', o:['[1,2,3]','[0,1,2]','[0,1,2,3]','[1,2]'], a:'B', e:'range(3) produces 0,1,2.' },
      { c:'Which operator is used for exponentiation?', o:['*','**','^','^^'], a:'B', e:'** is the power operator in Python.' },
      { c:'What does `None` represent in Python?', o:['Zero','Empty string','Null value','False'], a:'C', e:'None is Python\'s null value.' },
      { c:'How do you start a comment in Python?', o:['//','/*','#','--'], a:'C', e:'# starts a comment in Python.' },
      { c:'What is a list comprehension?', o:['A loop','A concise way to create lists','A dictionary method','A class'], a:'B', e:'List comprehensions are concise list-creation syntax.' },
      { c:'Which method adds an item to a list?', o:['add()','insert()','append()','push()'], a:'C', e:'append() adds an item to the end of a list.' },
    ],
    JavaScript: [
      { c:'Which keyword declares a block-scoped variable?', o:['var','let','const','all of these'], a:'B', e:'let is block-scoped.' },
      { c:'What does `===` check?', o:['Value only','Type only','Value and type','Reference'], a:'C', e:'=== checks strict equality (value AND type).' },
      { c:'Which method removes the last array element?', o:['shift()','pop()','splice()','slice()'], a:'B', e:'pop() removes and returns the last element.' },
      { c:'What is a closure?', o:['A loop','A function with access to its outer scope','An object method','An ES6 class'], a:'B', e:'Closures give inner functions access to outer scope.' },
      { c:'What does JSON stand for?', o:['Java Standard Object Notation','JavaScript Object Notation','Java Serialized Object Notation','JavaScript Online Notation'], a:'B', e:'JSON = JavaScript Object Notation.' },
      { c:'Which event fires when DOM is ready?', o:['onload','DOMContentLoaded','ready','init'], a:'B', e:'DOMContentLoaded fires when HTML is parsed.' },
      { c:'What does `typeof null` return?', o:['"null"','"undefined"','"object"','"boolean"'], a:'C', e:'This is a known quirk — typeof null returns "object".' },
      { c:'How do you create a Promise?', o:['new Promise()','Promise.create()','async()','makePromise()'], a:'A', e:'new Promise((resolve, reject) => {}) creates a promise.' },
      { c:'What is the spread operator?', o:['->','>>','...','**'], a:'C', e:'... spreads iterable elements.' },
      { c:'Which method converts an object to JSON string?', o:['JSON.parse()','JSON.stringify()','toString()','serialize()'], a:'B', e:'JSON.stringify() serializes an object to JSON string.' },
    ],
    SQL: [
      { c:'Which SQL clause filters rows?', o:['ORDER BY','GROUP BY','WHERE','HAVING'], a:'C', e:'WHERE filters individual rows before grouping.' },
      { c:'What does SELECT DISTINCT do?', o:['Sorts results','Removes duplicate rows','Counts rows','Creates a view'], a:'B', e:'DISTINCT eliminates duplicate rows from results.' },
      { c:'Which JOIN returns all rows from both tables?', o:['INNER JOIN','LEFT JOIN','RIGHT JOIN','FULL OUTER JOIN'], a:'D', e:'FULL OUTER JOIN returns all rows from both tables.' },
      { c:'What does PRIMARY KEY ensure?', o:['Rows are sorted','Each row is unique and not NULL','Foreign key reference','Indexing only'], a:'B', e:'PRIMARY KEY uniquely identifies each row.' },
      { c:'Which aggregate function counts non-NULL values?', o:['SUM()','AVG()','COUNT()','MAX()'], a:'C', e:'COUNT(column) counts non-NULL values in that column.' },
      { c:'What does HAVING clause do?', o:['Filter rows','Filter groups after GROUP BY','Sort results','Join tables'], a:'B', e:'HAVING filters groups formed by GROUP BY.' },
      { c:'What is a stored procedure?', o:['A view','A trigger','A saved SQL block executed by name','An index'], a:'C', e:'Stored procedures are named, reusable SQL blocks.' },
      { c:'Which SQL command removes a table and its data?', o:['DELETE','DROP','TRUNCATE','REMOVE'], a:'B', e:'DROP TABLE removes the table and all its data permanently.' },
      { c:'What does FOREIGN KEY enforce?', o:['Uniqueness','Referential integrity','NOT NULL','Check constraint'], a:'B', e:'FOREIGN KEY ensures referenced rows exist in the parent table.' },
      { c:'Which index speeds up full-text search?', o:['B-Tree index','Hash index','Full-text index','Bitmap index'], a:'C', e:'Full-text index is optimized for text searching.' },
    ],
    React: [
      { c:'What is a React component?', o:['A database table','A reusable UI piece','An HTTP method','A CSS class'], a:'B', e:'Components are reusable, self-contained UI building blocks.' },
      { c:'Which hook manages local state?', o:['useEffect','useRef','useState','useContext'], a:'C', e:'useState returns a state variable and a setter function.' },
      { c:'What is JSX?', o:['A database query language','JavaScript XML-like syntax','A CSS preprocessor','A build tool'], a:'B', e:'JSX lets you write HTML-like syntax inside JavaScript.' },
      { c:'Which hook runs after every render?', o:['useState','useRef','useEffect','useCallback'], a:'C', e:'useEffect runs after every render by default.' },
      { c:'What does props stand for?', o:['Properties passed to a component','Prototype objects','Programming operations','None'], a:'A', e:'Props are read-only inputs passed from parent to child.' },
      { c:'What is the virtual DOM?', o:['A real browser DOM','A lightweight JS copy of the DOM','A database','A server concept'], a:'B', e:'The virtual DOM is a lightweight JS representation for efficient updates.' },
      { c:'Which method renders React to the DOM?', o:['React.render()','ReactDOM.render()','React.mount()','ReactDOM.attach()'], a:'B', e:'ReactDOM.render() mounts a component to the DOM.' },
      { c:'What is a controlled component?', o:['A component with no state','A component whose form inputs are driven by React state','A pure component','A HOC'], a:'B', e:'Controlled components keep form data in React state.' },
      { c:'Which hook avoids re-creating functions on every render?', o:['useState','useEffect','useMemo','useCallback'], a:'D', e:'useCallback memoizes functions to prevent unnecessary re-creation.' },
      { c:'What is React.Fragment used for?', o:['State management','Routing','Grouping elements without extra DOM nodes','Context'], a:'C', e:'Fragment lets you group children without adding a DOM wrapper.' },
    ],
    'Machine Learning': [
      { c:'What is supervised learning?', o:['Learning without labels','Learning with labelled data','Learning from rewards','Clustering'], a:'B', e:'Supervised learning trains on labelled input-output pairs.' },
      { c:'Which algorithm is used for classification?', o:['Linear Regression','K-Means','Logistic Regression','PCA'], a:'C', e:'Logistic Regression predicts categorical outcomes.' },
      { c:'What does overfitting mean?', o:['Model too simple','Model memorizes training data, fails on new data','Model trains slowly','Model has high bias'], a:'B', e:'Overfitting: high variance, low training error, high test error.' },
      { c:'What is a confusion matrix?', o:['A loss function','A table showing prediction vs actual outcomes','A neural network layer','A normalization technique'], a:'B', e:'Confusion matrix shows TP, TN, FP, FN counts.' },
      { c:'Which metric measures model accuracy for imbalanced data?', o:['Accuracy','Precision','F1-Score','MSE'], a:'C', e:'F1-Score balances precision and recall for imbalanced classes.' },
      { c:'What is cross-validation?', o:['Testing on training data','Splitting data into multiple folds to evaluate generalization','A regularization technique','A feature selection method'], a:'B', e:'Cross-validation gives a robust estimate of model performance.' },
      { c:'What does PCA stand for?', o:['Principal Component Analysis','Predictive Clustering Algorithm','Polynomial Classification Approach','Primary Cluster Assignment'], a:'A', e:'PCA reduces dimensionality by finding principal components.' },
      { c:'Which is a hyperparameter?', o:['Model weights','Learning rate','Predictions','Loss value'], a:'B', e:'Hyperparameters are set before training (e.g. learning rate, depth).' },
      { c:'What is a decision tree?', o:['A neural network','A flowchart-like model that splits data on features','A clustering algorithm','A dimensionality reduction tool'], a:'B', e:'Decision trees split data recursively on the best features.' },
      { c:'What is gradient descent?', o:['A data cleaning method','An optimization algorithm that minimizes loss by following gradient','A type of neural network','A feature engineering step'], a:'B', e:'Gradient descent iteratively updates weights to reduce loss.' },
    ],
    'Data Analysis': [
      { c:'What is exploratory data analysis (EDA)?', o:['Cleaning data only','Visually and statistically summarizing data before modeling','Building ML models','Deploying dashboards'], a:'B', e:'EDA reveals patterns, anomalies, and relationships in data.' },
      { c:'Which pandas method shows summary statistics?', o:['.head()','info()','describe()','shape'], a:'C', e:'describe() shows count, mean, std, min, max etc.' },
      { c:'What is an outlier?', o:['A missing value','A data point far from the rest','A duplicate row','A column header'], a:'B', e:'Outliers are extreme values that deviate significantly from others.' },
      { c:'Which chart is best for showing distribution?', o:['Pie chart','Bar chart','Histogram','Line chart'], a:'C', e:'Histograms show frequency distribution of a continuous variable.' },
      { c:'What does correlation measure?', o:['Causation between variables','Strength and direction of linear relationship','Mean of two variables','Count of matching values'], a:'B', e:'Correlation quantifies linear association (-1 to +1).' },
      { c:'What is missing data imputation?', o:['Removing missing rows','Filling missing values with estimated values','Ignoring nulls','Flagging errors'], a:'B', e:'Imputation fills missing values using mean, median, or models.' },
      { c:'What is a pivot table?', o:['A database join','A table that summarizes data by grouping and aggregating','A data type','A normalization form'], a:'B', e:'Pivot tables reorganize and summarize data by categories.' },
      { c:'Which scale has a true zero point?', o:['Nominal','Ordinal','Interval','Ratio'], a:'D', e:'Ratio scale has an absolute zero (e.g. weight, height).' },
      { c:'What does standard deviation measure?', o:['The average value','The spread of data around the mean','The maximum value','The correlation'], a:'B', e:'Standard deviation shows how spread out data is from the mean.' },
      { c:'What is data normalization?', o:['Removing duplicates','Scaling values to a standard range','Sorting data','Adding primary keys'], a:'B', e:'Normalization scales features to [0,1] or standard normal.' },
    ],
    'Node.js': [
      { c:'What is Node.js?', o:['A frontend framework','A server-side JavaScript runtime','A database','A CSS tool'], a:'B', e:'Node.js runs JavaScript on the server using V8 engine.' },
      { c:'What does npm stand for?', o:['New Project Manager','Node Package Manager','Node Program Module','Network Protocol Manager'], a:'B', e:'npm is the Node Package Manager for installing packages.' },
      { c:'Which module handles HTTP in Node.js?', o:['fs','path','http','url'], a:'C', e:'The built-in http module creates web servers.' },
      { c:'What is middleware in Express?', o:['A database driver','A function that processes requests before route handlers','A CSS file','A deployment tool'], a:'B', e:'Middleware intercepts and processes HTTP requests.' },
      { c:'What does res.json() do?', o:['Reads JSON file','Sends JSON response to client','Parses JSON body','Saves JSON to DB'], a:'B', e:'res.json() sends a JSON-formatted HTTP response.' },
      { c:'What is async/await used for?', o:['CSS animations','Handling promises cleanly','Database schemas','Routing'], a:'B', e:'async/await is syntax sugar over Promises for async code.' },
      { c:'Which method mounts a route in Express?', o:['app.use()','app.route()','app.listen()','app.get()'], a:'A', e:'app.use() mounts middleware or routers at a path.' },
      { c:'What is the event loop?', o:['A for loop','A Node.js mechanism handling async operations','A database cursor','A CSS animation'], a:'B', e:'The event loop enables non-blocking I/O in Node.js.' },
      { c:'What does process.env do?', o:['Runs a new process','Accesses environment variables','Kills a process','Lists files'], a:'B', e:'process.env provides access to OS environment variables.' },
      { c:'Which package validates request data in Express?', o:['mongoose','bcryptjs','express-validator','jsonwebtoken'], a:'C', e:'express-validator provides validation/sanitization middleware.' },
    ],
    MongoDB: [
      { c:'What type of database is MongoDB?', o:['Relational','Graph','Document NoSQL','Column-store'], a:'C', e:'MongoDB stores data as BSON documents (NoSQL).' },
      { c:'What is a MongoDB collection?', o:['Equivalent to a SQL table','Equivalent to a SQL row','Equivalent to a SQL column','A stored procedure'], a:'A', e:'A collection is MongoDB\'s equivalent of a SQL table.' },
      { c:'Which method inserts one document?', o:['insertMany()','save()','insertOne()','add()'], a:'C', e:'insertOne() adds a single document to a collection.' },
      { c:'What is an ObjectId?', o:['A numeric auto-increment ID','A 12-byte unique identifier generated by MongoDB','A UUID','A string key'], a:'B', e:'ObjectId is MongoDB\'s default unique document identifier.' },
      { c:'Which operator filters documents in a query?', o:['$match','$group','$project','$sort'], a:'A', e:'In aggregation, $match filters documents like SQL WHERE.' },
      { c:'What does $lookup do in an aggregation pipeline?', o:['Filters documents','Performs a join with another collection','Groups documents','Sorts results'], a:'B', e:'$lookup performs a left outer join with another collection.' },
      { c:'What is Mongoose?', o:['A MongoDB GUI','An ODM library for MongoDB in Node.js','A caching tool','A query builder for SQL'], a:'B', e:'Mongoose provides schema definition and model validation for MongoDB.' },
      { c:'Which method finds all documents matching a query?', o:['findOne()','find()','search()','query()'], a:'B', e:'find() returns a cursor of all matching documents.' },
      { c:'What is the purpose of an index in MongoDB?', o:['Store extra data','Speed up query performance','Enforce uniqueness only','Create relationships'], a:'B', e:'Indexes improve read performance by avoiding full collection scans.' },
      { c:'Which pipeline stage shapes the output fields?', o:['$match','$group','$project','$lookup'], a:'C', e:'$project includes/excludes fields and adds computed fields.' },
    ],
    Docker: [
      { c:'What is a Docker container?', o:['A virtual machine','A lightweight, isolated process runtime','A cloud server','A database'], a:'B', e:'Containers package app + dependencies in an isolated environment.' },
      { c:'What is a Dockerfile?', o:['A Docker log file','A script with instructions to build a Docker image','A container config','A network file'], a:'B', e:'Dockerfile defines steps to build a Docker image.' },
      { c:'What does `docker run` do?', o:['Builds an image','Starts a container from an image','Stops a container','Lists images'], a:'B', e:'docker run creates and starts a container from an image.' },
      { c:'What is a Docker image?', o:['A running container','A snapshot/template used to create containers','A network','A volume'], a:'B', e:'Images are immutable templates from which containers are created.' },
      { c:'Which command shows running containers?', o:['docker images','docker ps','docker logs','docker stats'], a:'B', e:'docker ps lists currently running containers.' },
      { c:'What is Docker Compose used for?', o:['Building images','Running multi-container applications','Cloud deployment','Networking only'], a:'B', e:'Docker Compose defines and runs multi-container apps via YAML.' },
      { c:'What does Docker Hub provide?', o:['A container runtime','A public registry of Docker images','A local development tool','A CI/CD pipeline'], a:'B', e:'Docker Hub is a cloud-based registry for sharing Docker images.' },
      { c:'What is a Docker volume?', o:['A disk partition','Persistent storage for container data','A container network','A resource limit'], a:'B', e:'Volumes persist data beyond the container\'s lifecycle.' },
      { c:'What does EXPOSE do in a Dockerfile?', o:['Opens firewall ports','Documents which port the container listens on','Publishes the port to host','Sets environment variables'], a:'B', e:'EXPOSE documents the port; -p publishes it to the host.' },
      { c:'Which command stops a running container?', o:['docker pause','docker kill','docker stop','docker end'], a:'C', e:'docker stop gracefully stops the container.' },
    ],
    AWS: [
      { c:'What does EC2 stand for?', o:['Elastic Container Cloud','Elastic Compute Cloud','Extended Cloud Cluster','Enhanced Compute Core'], a:'B', e:'EC2 provides resizable compute capacity in the cloud.' },
      { c:'What is S3 used for?', o:['Computing','Object/file storage','Relational database','DNS routing'], a:'B', e:'S3 (Simple Storage Service) stores objects/files.' },
      { c:'What is IAM in AWS?', o:['Image Asset Manager','Identity and Access Management','Instance Auto-Maintenance','Internal AMI tool'], a:'B', e:'IAM controls user access and permissions in AWS.' },
      { c:'Which service provides managed relational databases?', o:['DynamoDB','S3','RDS','Lambda'], a:'C', e:'RDS (Relational Database Service) manages SQL databases.' },
      { c:'What is AWS Lambda?', o:['A computing VM','Serverless function-as-a-service','A container service','A CDN'], a:'B', e:'Lambda runs code without provisioning servers.' },
      { c:'What is a VPC?', o:['Virtual Persistent Cache','Virtual Private Cloud','Volume Provisioning Center','Verified Public Cluster'], a:'B', e:'VPC is a logically isolated network in AWS.' },
      { c:'Which service distributes traffic across servers?', o:['CloudFront','Route 53','Elastic Load Balancer','Auto Scaling'], a:'C', e:'ELB (Elastic Load Balancer) distributes incoming traffic.' },
      { c:'What is CloudFront?', o:['A compute service','A CDN that caches content at edge locations','A monitoring tool','A storage service'], a:'B', e:'CloudFront is AWS\'s global CDN.' },
      { c:'What is Auto Scaling?', o:['Manual server provisioning','Automatically adjusting capacity based on demand','A backup service','A deployment tool'], a:'B', e:'Auto Scaling adds/removes instances based on load.' },
      { c:'What is DynamoDB?', o:['A SQL database','A fully managed NoSQL key-value database','A caching layer','A message queue'], a:'B', e:'DynamoDB is AWS\'s managed NoSQL database.' },
    ],
    Git: [
      { c:'What does `git init` do?', o:['Clones a repo','Initializes a new Git repository','Commits changes','Pushes to remote'], a:'B', e:'git init creates a new empty Git repository.' },
      { c:'Which command stages all changes?', o:['git commit -m','git add .','git push','git status'], a:'B', e:'git add . stages all modified and new files.' },
      { c:'What does `git merge` do?', o:['Creates a new branch','Integrates changes from one branch into another','Deletes a branch','Resets commits'], a:'B', e:'git merge integrates changes from one branch into another.' },
      { c:'What is a pull request?', o:['Fetching remote changes','A request to merge code changes reviewed by peers','Deleting a remote branch','A git command'], a:'B', e:'A pull request (PR) proposes changes for review before merging.' },
      { c:'What does `git stash` do?', o:['Saves commits','Temporarily shelves uncommitted changes','Deletes changes','Creates a backup branch'], a:'B', e:'git stash saves local changes without committing.' },
      { c:'Which command shows commit history?', o:['git diff','git log','git status','git show'], a:'B', e:'git log displays the commit history.' },
      { c:'What is a Git branch?', o:['A remote server','A copy of the repo','An independent line of development','A commit message'], a:'C', e:'Branches allow parallel development without affecting main code.' },
      { c:'What does `git rebase` do?', o:['Merges branches with a merge commit','Replays commits from one branch onto another','Resets to a commit','Deletes old branches'], a:'B', e:'Rebase moves/replays commits for a cleaner linear history.' },
      { c:'What is `.gitignore` for?', o:['Listing team members','Specifying files Git should not track','Storing commit messages','Defining branch rules'], a:'B', e:'.gitignore tells Git which files/folders to ignore.' },
      { c:'What does `git clone` do?', o:['Creates a new repo','Downloads a remote repository locally','Uploads changes','Creates a new branch'], a:'B', e:'git clone copies a remote repository to your local machine.' },
    ],
    'API Development': [
      { c:'What does REST stand for?', o:['Remote Execution State Transfer','Representational State Transfer','Reliable Endpoint Standard Transfer','Resource Event System Toolkit'], a:'B', e:'REST = Representational State Transfer, an architectural style for APIs.' },
      { c:'Which HTTP method is used to CREATE a resource?', o:['GET','PUT','POST','DELETE'], a:'C', e:'POST is used to create a new resource.' },
      { c:'What is an HTTP status code 404?', o:['Server error','Unauthorized','Not Found','OK'], a:'C', e:'404 means the requested resource was not found.' },
      { c:'What is JWT used for?', o:['Database queries','Image storage','Stateless authentication tokens','CSS styling'], a:'C', e:'JWT (JSON Web Token) is used for stateless authentication.' },
      { c:'Which HTTP method retrieves data without side effects?', o:['POST','PUT','PATCH','GET'], a:'D', e:'GET is idempotent and safe — it only retrieves data.' },
      { c:'What is CORS?', o:['A CSS framework','Cross-Origin Resource Sharing — controls cross-domain requests','A database driver','An authentication protocol'], a:'B', e:'CORS restricts which origins can access your API.' },
      { c:'What does status code 401 mean?', o:['Not Found','Forbidden','Unauthorized','Bad Request'], a:'C', e:'401 Unauthorized means authentication is required.' },
      { c:'What is rate limiting?', o:['Slowing down DB queries','Restricting how many requests a client can make in a time window','A caching strategy','A load balancing technique'], a:'B', e:'Rate limiting prevents API abuse by capping requests per time period.' },
      { c:'Which format is most common for REST APIs?', o:['XML','CSV','JSON','YAML'], a:'C', e:'JSON is the standard data format for REST APIs.' },
      { c:'What does idempotent mean in REST?', o:['The request changes data','The same request always produces the same result','The request is authenticated','The request needs a body'], a:'B', e:'Idempotent: repeating the same request has no extra effect.' },
    ],
    Statistics: [
      { c:'What is the mean?', o:['The most frequent value','The middle value','The average','The range'], a:'C', e:'Mean = sum of all values / count.' },
      { c:'What is the median?', o:['The average','The middle value when sorted','The most frequent value','The standard deviation'], a:'B', e:'Median is the middle value of a sorted dataset.' },
      { c:'What does a p-value < 0.05 indicate?', o:['Accept null hypothesis','Reject null hypothesis (statistically significant)','No relationship','Correlation is 1'], a:'B', e:'p < 0.05 means result is statistically significant at 95% confidence.' },
      { c:'What is standard deviation?', o:['Average value','Measure of spread around the mean','Maximum minus minimum','Median value'], a:'B', e:'Std dev measures how spread out values are from the mean.' },
      { c:'What is a normal distribution?', o:['A skewed curve','A bell-shaped symmetric distribution','A bimodal curve','A uniform distribution'], a:'B', e:'Normal distribution is bell-shaped, symmetric around the mean.' },
      { c:'What is correlation coefficient range?', o:['0 to 1','-1 to 0','-1 to 1','0 to 100'], a:'C', e:'Correlation coefficient r ranges from -1 to +1.' },
      { c:'What is Type I error?', o:['Failing to reject false null hypothesis','Rejecting a true null hypothesis','Accepting alternate hypothesis','None of these'], a:'B', e:'Type I error (false positive): rejecting a true null hypothesis.' },
      { c:'What is sampling bias?', o:['Selecting too many samples','Systematic error from non-representative samples','Random measurement error','Overfitting'], a:'B', e:'Sampling bias skews results when the sample is not representative.' },
      { c:'Which test compares means of two groups?', o:['Chi-square test','ANOVA','T-test','F-test'], a:'C', e:'T-test compares means between two groups.' },
      { c:'What is variance?', o:['Standard deviation squared','Mean squared','Max minus min','Sum of values'], a:'A', e:'Variance = standard deviation squared (measures spread).' },
    ],
  };

  // Fallback generic questions
  const generic = Array.from({length:10}, (_,i) => ({
    c:`Question ${i+1} about this skill at ${difficulty} level`,
    o:['Option A','Option B','Option C','Option D'],
    a:'A', e:`Explanation for question ${i+1}.`
  }));

  const pool = sets[Object.keys(sets).find(k => skillName === k || skillName?.toLowerCase().includes(k.toLowerCase()))] || generic;
  return pool.map(q => ({
    skill_id: skillId,
    content: q.c,
    options: q.o,
    correct_answer: q.a,
    difficulty: diff,
    explanation: q.e,
    question_type: 'mcq',
    max_marks: 1
  }));
}

async function runSeed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear old data (keep users)
  await Question.deleteMany({});
  await Assessment.deleteMany({});
  console.log('🗑️  Cleared questions & assessments');

  // Load skills
  const allSkills = await Skill.find({});
  if (allSkills.length === 0) {
    console.error('❌ No skills found. Run npm run seed first.');
    process.exit(1);
  }
  const skillMap = {};
  allSkills.forEach(s => { skillMap[s.skill_name] = s; });
  console.log(`✅ Loaded ${allSkills.length} skills`);

  // Load careers
  const allCareers = await Career.find({});
  const careerMap = {};
  allCareers.forEach(c => { careerMap[c.title] = c; });

  let totalAssessments = 0, totalQuestions = 0;

  for (const def of ASSESSMENTS) {
    // Find primary skill for this career
    const careerSkillNames = CAREER_SKILL_MAP[def.career_role] || [];
    const linkedSkillIds = careerSkillNames
      .filter(n => skillMap[n])
      .map(n => skillMap[n]._id);

    const primarySkill = skillMap[careerSkillNames[0]] || allSkills[0];
    const career = careerMap[def.career_role];

    // Create assessment
    const assessment = await Assessment.create({
      title: def.title,
      description: def.description,
      skill_ids: linkedSkillIds,
      career_role: def.career_role,
      career_id: career?._id || null,
      question_count: 10,
      time_limit: def.time_limit,
      difficulty: def.difficulty,
      is_active: true,
    });
    totalAssessments++;

    // Create 10 questions per assessment per skill
    for (const skillName of careerSkillNames.slice(0, 2)) {
      const skill = skillMap[skillName];
      if (!skill) continue;
      const questions = makeQuestions(skill._id, skillName, def.difficulty);
      await Question.insertMany(questions.slice(0, 5));
      totalQuestions += 5;
    }

    console.log(`  ✅ ${def.career_role} — ${def.difficulty}: "${def.title}" + 10 questions`);
  }

  console.log(`\n🎉 Done! ${totalAssessments} assessments, ${totalQuestions} questions seeded.`);
  await mongoose.connection.close();
}

runSeed().catch(err => { console.error('❌', err.message); process.exit(1); });

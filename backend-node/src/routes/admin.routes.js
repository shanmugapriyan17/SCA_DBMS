/**
 * @file admin.routes.js
 * @description Admin seed endpoint — 8 careers, 24 assessments, 240 questions, 13 skills
 */
const express = require('express');
const router = express.Router();
const { Skill, Question, Assessment, Career, User } = require('../models');

// ─── Career → Skills mapping ────────────────────────────────────────────────
const CAREER_SKILL_MAP = {
  'Data Scientist':          ['Python','Machine Learning','SQL','Statistics','Data Analysis'],
  'Full Stack Developer':    ['JavaScript','React','Node.js','MongoDB','SQL'],
  'Frontend Developer':      ['JavaScript','React','Git'],
  'Backend Developer':       ['Python','SQL','API Development','Git'],
  'Data Analyst':            ['SQL','Data Analysis','Statistics','Python'],
  'ML Engineer':             ['Python','Machine Learning','Docker'],
  'DevOps Engineer':         ['Docker','AWS','Git'],
  'Database Administrator':  ['SQL','MongoDB'],
};

// ─── 24 Assessments (8 careers × 3 difficulty levels) ───────────────────────
const ASSESSMENTS = [
  { career_role:'Data Scientist',         difficulty:'beginner',     title:'Data Science Foundations',         description:'Core concepts: Python basics, statistics, and data types.',                 time_limit:15 },
  { career_role:'Data Scientist',         difficulty:'intermediate', title:'Data Science Practitioner',        description:'Applied ML algorithms, data wrangling, feature engineering.',              time_limit:20 },
  { career_role:'Data Scientist',         difficulty:'advanced',     title:'Data Science Expert',              description:'Deep learning, model deployment, advanced statistical modeling.',          time_limit:25 },
  { career_role:'Full Stack Developer',   difficulty:'beginner',     title:'Full Stack Basics',                description:'HTML, CSS, JavaScript fundamentals and REST API concepts.',                 time_limit:15 },
  { career_role:'Full Stack Developer',   difficulty:'intermediate', title:'Full Stack Practitioner',          description:'React, Node.js, MongoDB CRUD operations, and authentication.',             time_limit:20 },
  { career_role:'Full Stack Developer',   difficulty:'advanced',     title:'Full Stack Expert',                description:'System design, microservices, performance optimization, Docker.',          time_limit:25 },
  { career_role:'Frontend Developer',     difficulty:'beginner',     title:'Frontend Foundations',             description:'HTML semantics, CSS layout, basic JavaScript DOM manipulation.',           time_limit:12 },
  { career_role:'Frontend Developer',     difficulty:'intermediate', title:'Frontend Practitioner',            description:'React hooks, state management, responsive design, API integration.',       time_limit:18 },
  { career_role:'Frontend Developer',     difficulty:'advanced',     title:'Frontend Expert',                  description:'Performance tuning, accessibility, testing, advanced React patterns.',    time_limit:22 },
  { career_role:'Backend Developer',      difficulty:'beginner',     title:'Backend Foundations',              description:'Server concepts, HTTP, REST APIs, basic SQL queries.',                    time_limit:15 },
  { career_role:'Backend Developer',      difficulty:'intermediate', title:'Backend Practitioner',             description:'Authentication, database design, middleware, error handling.',             time_limit:20 },
  { career_role:'Backend Developer',      difficulty:'advanced',     title:'Backend Expert',                   description:'Scalability, caching, message queues, security best practices.',          time_limit:25 },
  { career_role:'Data Analyst',           difficulty:'beginner',     title:'Data Analytics Foundations',       description:'SQL basics, data types, simple aggregations, chart reading.',              time_limit:12 },
  { career_role:'Data Analyst',           difficulty:'intermediate', title:'Data Analytics Practitioner',      description:'Advanced SQL, pivot tables, statistical analysis, visualization.',         time_limit:18 },
  { career_role:'Data Analyst',           difficulty:'advanced',     title:'Data Analytics Expert',            description:'Predictive analytics, A/B testing, complex SQL, Python pandas.',          time_limit:22 },
  { career_role:'ML Engineer',            difficulty:'beginner',     title:'ML Engineering Foundations',       description:'ML pipeline concepts, Python, data preprocessing basics.',                 time_limit:15 },
  { career_role:'ML Engineer',            difficulty:'intermediate', title:'ML Engineering Practitioner',      description:'Model training, evaluation metrics, hyperparameter tuning.',               time_limit:20 },
  { career_role:'ML Engineer',            difficulty:'advanced',     title:'ML Engineering Expert',            description:'MLOps, model serving, Docker, monitoring and retraining pipelines.',      time_limit:25 },
  { career_role:'DevOps Engineer',        difficulty:'beginner',     title:'DevOps Foundations',               description:'Linux basics, version control, CI/CD concepts, containers intro.',        time_limit:15 },
  { career_role:'DevOps Engineer',        difficulty:'intermediate', title:'DevOps Practitioner',              description:'Docker, Kubernetes basics, GitHub Actions, cloud services.',              time_limit:20 },
  { career_role:'DevOps Engineer',        difficulty:'advanced',     title:'DevOps Expert',                    description:'Infrastructure as code, monitoring, scaling, security in pipelines.',    time_limit:25 },
  { career_role:'Database Administrator', difficulty:'beginner',     title:'DBA Foundations',                  description:'Relational concepts, basic SQL, data integrity, normalization.',          time_limit:12 },
  { career_role:'Database Administrator', difficulty:'intermediate', title:'DBA Practitioner',                 description:'Indexing, query optimization, transactions, backup strategies.',          time_limit:18 },
  { career_role:'Database Administrator', difficulty:'advanced',     title:'DBA Expert',                       description:'Performance tuning, replication, sharding, NoSQL vs SQL trade-offs.',   time_limit:22 },
];

// ─── 10 Questions per skill ──────────────────────────────────────────────────
const QUESTION_BANK = {
  Python: [
    { c:"What is the output of print(type([]))?", o:["<class 'list'>","<class 'array'>","<class 'tuple'>","<class 'dict'>"], a:'A', e:"[] is a list literal, so type([]) returns <class 'list'>." },
    { c:"Which keyword is used to handle exceptions in Python?", o:['throw','catch','except','rescue'], a:'C', e:'Python uses try/except blocks for exception handling.' },
    { c:"What does the `append()` method do to a Python list?", o:['Removes last item','Adds item to beginning','Adds item to end','Sorts the list'], a:'C', e:'append() adds a single element to the end of the list.' },
    { c:"What is the result of 5 // 2 in Python?", o:['2.5','2','3','0'], a:'B', e:'// is floor division — returns integer quotient: 5//2 = 2.' },
    { c:"Which data structure does NOT allow duplicate values?", o:['List','Tuple','Set','Dictionary values'], a:'C', e:'Sets automatically remove duplicates.' },
    { c:"What does `*args` allow a Python function to accept?", o:['Keyword arguments only','Any number of positional arguments','A dictionary','Default arguments'], a:'B', e:'*args collects extra positional arguments into a tuple.' },
    { c:"Which Python library is most commonly used for data manipulation?", o:['NumPy','Pandas','Matplotlib','Scikit-learn'], a:'B', e:'Pandas provides DataFrame structures for data manipulation.' },
    { c:"What is a lambda function in Python?", o:['A class method','An anonymous single-expression function','A recursive function','A generator function'], a:'B', e:'Lambda creates small anonymous functions: lambda x: x+1.' },
    { c:"What does the `zip()` function do?", o:['Compresses files','Combines multiple iterables element-by-element','Sorts lists','Converts to dictionary'], a:'B', e:'zip() pairs elements from multiple iterables together.' },
    { c:"What is the purpose of `__init__` in a Python class?", o:['Destroys the object','Initializes object attributes when created','Exports the class','Makes class iterable'], a:'B', e:'__init__ is the constructor that runs when a new object is created.' },
  ],
  JavaScript: [
    { c:"What is the difference between `null` and `undefined` in JavaScript?", o:['They are identical','null is assigned intentionally; undefined means not yet assigned','undefined is intentional; null means not declared','Both mean the variable does not exist'], a:'B', e:'null is intentional absence; undefined means not yet assigned.' },
    { c:"What does the `Array.map()` method return?", o:['Original array modified','A new array with results of calling a function on each element','The first matching element','A boolean'], a:'B', e:'map() creates a new array without mutating the original.' },
    { c:"What is event bubbling in JavaScript?", o:['An animation technique','Events propagate from child to parent elements','Events propagate from parent to child','A memory strategy'], a:'B', e:'Event bubbling means the event fires on target then propagates up to ancestors.' },
    { c:"What does `Promise.all()` do?", o:['Runs promises sequentially','Resolves when ALL promises resolve, rejects if any rejects','Resolves on FIRST resolve','Ignores rejected promises'], a:'B', e:'Promise.all() waits for all promises to resolve, failing fast on rejection.' },
    { c:"What is the output of typeof NaN?", o:['NaN','undefined','number','object'], a:'C', e:'typeof NaN returns "number" — NaN is technically a number type in JS.' },
    { c:"Which method creates a shallow copy of an array?", o:['array.copy()','array.clone()','array.slice()','array.splice()'], a:'C', e:'slice() without arguments returns a shallow copy of the full array.' },
    { c:"What is a closure in JavaScript?", o:['A way to close browser windows','A function retaining access to outer scope even after returning','A method to end a loop','A type of class'], a:'B', e:'Closures let inner functions access outer scope variables even after returning.' },
    { c:"What does the `===` operator check?", o:['Only value equality','Only type equality','Both value AND type equality (strict)','Reference equality only'], a:'C', e:'=== is strict equality: both value and type must match.' },
    { c:"What is async/await in JavaScript?", o:['A CSS animation API','Syntax for working with Promises in synchronous-looking style','A multithreading mechanism','A way to write blocking code'], a:'B', e:'async/await makes asynchronous Promise code look synchronous and readable.' },
    { c:"What does `Object.keys()` return?", o:["An array of the object's values","An array of the object's own enumerable property names","The number of keys","A Map of key-value pairs"], a:'B', e:"Object.keys() returns an array of the object's own enumerable property names." },
  ],
  SQL: [
    { c:"What is the difference between DELETE and TRUNCATE in SQL?", o:['No difference','DELETE can use WHERE; TRUNCATE removes ALL rows without logging individual deletes','TRUNCATE can use WHERE','DELETE is faster'], a:'B', e:'DELETE is DML and can be rolled back; TRUNCATE is DDL and faster but cannot.' },
    { c:"What does INNER JOIN return?", o:['All rows from both tables','Only matching rows from both tables','All rows from left table','Only non-matching rows'], a:'B', e:'INNER JOIN returns only rows where the join condition is met in BOTH tables.' },
    { c:"What is database normalization?", o:['Backing up a database','Organizing data to reduce redundancy and improve integrity','Encrypting tables','Compressing files'], a:'B', e:'Normalization organizes tables to minimize redundancy using normal forms (1NF, 2NF, 3NF).' },
    { c:"Which SQL clause filters results AFTER grouping?", o:['WHERE','HAVING','GROUP BY','ORDER BY'], a:'B', e:'HAVING filters groups; WHERE filters individual rows before grouping.' },
    { c:"What is a stored procedure?", o:['A table view','A saved, named SQL block executed by calling its name','An automatic trigger','A database index'], a:'B', e:'Stored procedures store SQL logic server-side for reuse, security, and performance.' },
    { c:"What is an index in SQL and why is it used?", o:['A foreign key constraint','A data structure that speeds up row lookup','A way to join tables','A backup copy of a table'], a:'B', e:'Indexes allow the DB engine to find rows without scanning the full table.' },
    { c:"What is the purpose of a FOREIGN KEY constraint?", o:['Ensure column values are unique','Enforce referential integrity between two tables','Create an index automatically','Prevent NULL values'], a:'B', e:'FOREIGN KEY ensures values in one table match values in the parent table.' },
    { c:"What does SELECT DISTINCT do?", o:['Selects only the first row','Returns unique/deduplicated rows','Selects random rows','Selects rows in sorted order'], a:'B', e:'DISTINCT removes duplicate rows from the result set.' },
    { c:"What is a SQL trigger?", o:['A scheduled job','A database object that executes automatically on a specific table event','A stored procedure called manually','A type of index'], a:'B', e:'Triggers fire automatically on INSERT, UPDATE, or DELETE events.' },
    { c:"Which aggregate function returns the count of non-NULL values?", o:['SUM()','TOTAL()','COUNT(column_name)','AVG()'], a:'C', e:'COUNT(column) counts non-NULL values; COUNT(*) counts all rows including NULLs.' },
  ],
  React: [
    { c:"What problem does useCallback solve?", o:['State management','Prevents new function reference on every render avoiding unnecessary child re-renders','Fetches data from APIs','Manages global state'], a:'B', e:'useCallback memoizes a function so it only changes if dependencies change.' },
    { c:"What is the React Context API used for?", o:['Styling components','Passing data through the component tree without prop drilling','Fetching data from server','Managing component lifecycle'], a:'B', e:'Context provides a way to share values globally without passing props at every level.' },
    { c:"What is the virtual DOM?", o:['A browser API for fast rendering','A lightweight JS representation of the DOM that minimizes real DOM manipulations','A way to use CSS in JS','A server-side rendering technique'], a:'B', e:'React diffs the virtual DOM and only updates the actual DOM where necessary.' },
    { c:"What does the useEffect dependency array control?", o:['The order of effects','When the effect re-runs (only when listed values change)','The initial state','The return value'], a:'B', e:'Empty array [] = runs once; [val] = runs when val changes; no array = every render.' },
    { c:"What is a React key prop used for?", o:['Styling list items','Helping React identify which items changed in a list','Passing data to child','Preventing re-renders'], a:'B', e:'Keys help React match old and new elements to minimize DOM updates.' },
    { c:"What is the difference between state and props?", o:['They are the same','State is internal and mutable; props are external and read-only from parent','Props are internal; state comes from parent','Both are immutable'], a:'B', e:'State belongs to component and changes via setState; props are passed from parent and readonly.' },
    { c:"What does React.memo do?", o:['Memorizes API responses','Memoizes a component to prevent re-rendering when props unchanged','Creates a new context','Handles side effects'], a:'B', e:'React.memo wraps a component and skips re-rendering if props are unchanged.' },
    { c:"What hook would you use to refer to a DOM element directly?", o:['useState','useEffect','useRef','useContext'], a:'C', e:'useRef creates a mutable ref object that can hold a reference to a DOM node.' },
    { c:"What is code splitting in React?", o:['Breaking CSS into files','Splitting the JS bundle into chunks loaded on demand using React.lazy and Suspense','Splitting state across components','A build optimization for CSS'], a:'B', e:'React.lazy + Suspense enable dynamic imports to load components only when needed.' },
    { c:"Which lifecycle does useEffect with empty dependency array correspond to?", o:['componentDidUpdate','componentWillUnmount','componentDidMount','shouldComponentUpdate'], a:'C', e:'useEffect(() => {}, []) runs once after mount, equivalent to componentDidMount.' },
  ],
  'Machine Learning': [
    { c:"What is the difference between classification and regression?", o:['No difference','Classification predicts discrete categories; Regression predicts continuous numeric values','Regression predicts categories; Classification predicts numbers','Both predict continuous values'], a:'B', e:'Classification: "Is this spam?" Regression: "What price will this house sell for?"' },
    { c:"What does the learning rate control in gradient descent?", o:['Number of training epochs','How many layers the neural network has','Step size taken in the direction of steepest descent each iteration','Size of training dataset'], a:'C', e:'Too high = overshoots minimum; too low = learns slowly. Typical values: 0.001–0.1.' },
    { c:"What is the bias-variance tradeoff?", o:['A way to reduce training data',"The tradeoff between a model's ability to fit training data and generalize",'CPU vs GPU usage','A regularization technique'], a:'B', e:'High bias = underfitting; high variance = overfitting. Goal: find the sweet spot.' },
    { c:"What does the ROC curve measure?", o:['Training speed','Model size in memory','Tradeoff between True Positive Rate and False Positive Rate at different thresholds','Feature importance'], a:'C', e:'AUC-ROC measures discriminative ability; AUC=1 is perfect, AUC=0.5 is random.' },
    { c:"What is regularization in machine learning?", o:['Normalizing input features','Adding a penalty term to the loss function to reduce model complexity','Standardizing training data','A type of activation function'], a:'B', e:'L1 (Lasso) and L2 (Ridge) regularization penalize large weights to reduce overfitting.' },
    { c:"What is the purpose of train/test split?", o:['To speed up training','To evaluate model performance on unseen data and detect overfitting','To reduce dataset size','To balance the dataset'], a:'B', e:'Testing on held-out data shows how the model generalizes to unseen examples.' },
    { c:"What is a Random Forest?", o:['A single deep decision tree','An ensemble of decision trees trained on random subsets, aggregated by voting/averaging','A neural network architecture','A clustering algorithm'], a:'B', e:'Random forests combine many trees (bagging) to reduce variance and improve accuracy.' },
    { c:"What does K-Means clustering do?", o:['Classifies data with labels','Partitions unlabeled data into K groups by minimizing within-cluster distance','Reduces dimensionality','Detects outliers'], a:'B', e:'K-Means is unsupervised: groups data points so similar points are in the same cluster.' },
    { c:"What is transfer learning?", o:['Moving data between servers','Reusing a model trained on one task as the starting point for a related task','Transferring model weights randomly','Training from scratch on new data'], a:'B', e:'Transfer learning reuses learned features, dramatically reducing training time and data requirements.' },
    { c:"What is a confusion matrix?", o:['A matrix that confuses the model','A table showing TP, TN, FP, FN to evaluate classification model performance','A weight matrix in a neural network','A visualization of feature correlations'], a:'B', e:'Confusion matrix reveals how often the model confuses classes — basis for precision, recall, F1.' },
  ],
  MongoDB: [
    { c:"How does MongoDB store data internally?", o:['In SQL tables with rows and columns','In BSON (Binary JSON) documents within collections','In flat CSV files','In XML format'], a:'B', e:'MongoDB stores data as BSON documents — binary-encoded JSON with extra types like ObjectId.' },
    { c:"What is the MongoDB aggregation pipeline?", o:['A query for simple lookups','A framework of stages that transform and compute data in sequence (like Unix pipes)','A replication mechanism','An indexing strategy'], a:'B', e:'Stages like $match, $group, $lookup, $project are chained to process documents.' },
    { c:"What is the difference between findOne() and find()?", o:['No difference','findOne() returns a single document; find() returns a cursor of all matching documents','find() is faster','findOne() searches all collections'], a:'B', e:'findOne() stops at first match; find() returns a lazy cursor over all matches.' },
    { c:"What is a MongoDB index and why is it important?", o:['A unique document ID','A data structure that improves query speed by avoiding full collection scans','A replication log','A schema validation rule'], a:'B', e:'Without an index, MongoDB does a COLLSCAN; with an index, it does an IXSCAN — much faster.' },
    { c:"Which MongoDB operator updates a specific field without replacing the whole document?", o:['$replace','$update','$set','$modify'], a:'C', e:'$set modifies specific fields; without it, updateOne() would replace the entire document.' },
    { c:"What is the purpose of the $lookup pipeline stage?", o:['To filter documents by field','To perform a left outer join between two collections','To sort documents','To count documents'], a:'B', e:'$lookup joins a foreign collection and adds matched documents as an array field.' },
    { c:"What is a replica set in MongoDB?", o:['A copy of a document','A group of MongoDB servers that maintain the same data for high availability and failover','A set of indexes','A collection of related documents'], a:'B', e:'Replica sets have one primary (writes) and multiple secondaries (reads/failover).' },
    { c:"What does the `upsert: true` option do?", o:['Prevents updates','Inserts a new document if no matching document is found for the update','Updates all matching documents','Creates a transaction'], a:'B', e:'Upsert = update + insert: update if found, insert if not.' },
    { c:"What is schema validation in MongoDB?", o:['A fixed schema like SQL','Rules (JSON Schema) applied at collection level to validate document structure before inserting','A way to normalize data','An index type'], a:'B', e:'MongoDB supports optional schema validation using JSON Schema via the validator option.' },
    { c:"What is the difference between MongoDB and a relational database?", o:['MongoDB requires a strict schema','MongoDB is schemaless (flexible documents); RDBMS uses fixed schemas with structured tables','MongoDB uses SQL','RDBMS is always faster'], a:'B', e:'MongoDB trades rigid structure for flexibility — great for evolving schemas and nested data.' },
  ],
  'Node.js': [
    { c:"What is the Node.js event loop?", o:['A for loop for processing arrays','A single-threaded mechanism that handles async I/O non-blockingly','A multi-threading scheduler','A memory management system'], a:'B', e:'The event loop allows Node.js to handle thousands of concurrent connections without blocking.' },
    { c:"What is the purpose of the `package.json` file?", o:['Stores user data','Defines project metadata, dependencies, scripts, and configuration for npm','Configures the web server','Stores environment variables'], a:'B', e:'package.json is the manifest for a Node.js project — lists all dependencies and scripts.' },
    { c:"What is middleware in Express.js?", o:['A database driver','A function that has access to req, res, and next — runs between receiving a request and sending a response','A routing library','A template engine'], a:'B', e:'Middleware chains allow you to process requests (auth, logging, validation) before reaching the route.' },
    { c:"What is the difference between `require()` and ES6 `import`?", o:['They are identical','require() is CommonJS (synchronous, dynamic); import is ES Module (static, tree-shakeable)','import is synchronous','require() is only for browser JS'], a:'B', e:'Node.js supports both, but require() is traditional Node.js; import is modern ESM standard.' },
    { c:"What does `app.use()` do in Express?", o:['Starts the server','Mounts middleware or routers at a specified path','Sets HTTP headers','Creates a database connection'], a:'B', e:'app.use() registers middleware for all HTTP methods and specified path prefix.' },
    { c:"What is the purpose of environment variables in Node.js?", o:['Store HTML templates','Externalize configuration (API keys, DB URLs) from code for security and flexibility','Define route handlers','Cache database queries'], a:'B', e:'env vars keep secrets out of code and allow different configs per environment (dev/prod).' },
    { c:"What does `res.status(404).json()` do in Express?", o:['Redirects to a 404 page','Sets HTTP response status to 404 and sends a JSON body','Logs the error','Terminates the server'], a:'B', e:'Chaining status() sets the HTTP status code; json() serializes the object and sends it.' },
    { c:"What is JWT and how is it used in Node.js APIs?", o:['A JavaScript testing tool','JSON Web Token — a signed token for stateless authentication between client and server','A database ORM','A Node.js template engine'], a:'B', e:'JWT contains user claims; server signs it with a secret; client sends it in Authorization header.' },
    { c:"What is the purpose of bcrypt?", o:['Compress responses','Hash passwords securely using a computationally expensive algorithm with salt','Encrypt HTTP connections','Manage database connections'], a:'B', e:'bcrypt adds a random salt and hashes passwords so even identical passwords produce different hashes.' },
    { c:"What is the difference between synchronous and asynchronous code in Node.js?", o:['No difference','Synchronous code blocks the thread; async code uses callbacks/promises to continue without blocking','Async code is always slower','Sync code uses more memory'], a:'B', e:'Async code is critical in Node.js to avoid blocking the single event loop thread.' },
  ],
  'Data Analysis': [
    { c:"What is the difference between structured and unstructured data?", o:['No difference','Structured follows a defined schema (tables/CSV); unstructured has no predefined format (text, images)','Structured is always better','Unstructured data cannot be analyzed'], a:'B', e:'Structured: relational DB tables. Unstructured: social media posts, images, documents.' },
    { c:"What is exploratory data analysis (EDA)?", o:['The final model deployment step','An initial investigation using statistics and visualization to understand data patterns before modeling','A machine learning algorithm','A way to collect data'], a:'B', e:'EDA reveals distributions, outliers, correlations, and missing data before you build models.' },
    { c:"What does a box plot show?", o:['The mean only','The five-number summary: minimum, Q1, median, Q3, maximum — showing distribution and outliers','The frequency of each value','The correlation between variables'], a:'B', e:'Box plots show spread, mean, and outliers visually through quartiles.' },
    { c:"When should you use median over mean?", o:['They are the same','Mean is the average; median is the middle value. Use median when data has outliers as it is more robust','Median is always better','Mean is better for skewed data'], a:'B', e:'Outliers distort the mean (e.g., average salary with billionaires). Median is more representative.' },
    { c:"What is Pearson correlation coefficient?", o:['A measure of causation','A measure of the linear relationship strength between two variables, ranging from -1 to +1','The slope of regression line','The number of data points'], a:'B', e:'+1 = perfect positive correlation; -1 = perfect negative; 0 = no linear relationship.' },
    { c:"What is the purpose of data normalization/standardization?", o:['To delete outliers','To scale features to a comparable range so one feature does not dominate others','To fill missing values','To remove duplicates'], a:'B', e:'Without normalization, a feature with range 0-10000 dominates one with range 0-1.' },
    { c:"What does GROUP BY do in a data analysis SQL query?", o:['Sorts the results','Aggregates rows that share the same value in specified columns, allowing aggregate functions per group','Filters rows','Joins two tables'], a:'B', e:'GROUP BY + aggregate functions (SUM, COUNT, AVG) are the foundation of report-style analysis.' },
    { c:"What is a pivot table?", o:['A chart type','A data summarization tool that reorganizes and aggregates data by categories across rows and columns','A machine learning model','A type of join operation'], a:'B', e:'Pivot tables let you cross-tabulate data: rows = dimension1, columns = dimension2, values = metric.' },
    { c:"What does A/B testing measure?", o:['Algorithm performance','The statistical significance of differences between two variants of a product or experience','Database query speed','Data quality'], a:'B', e:'A/B tests expose groups to variant A vs B and measure metric differences with statistical significance.' },
    { c:"What is data cleaning and why is it important?", o:['Deleting all the data','The process of detecting and fixing errors, inconsistencies, and missing values in datasets','Encrypting data for security','Creating backups'], a:'B', e:'"Garbage in, garbage out" — analysis is only as good as the data quality behind it.' },
  ],
  Statistics: [
    { c:"What is the Central Limit Theorem?", o:['All distributions are normal','With large enough sample size, the sampling distribution of the mean approaches normal distribution regardless of population shape','Sample mean always equals population mean','Standard deviation decreases with more data'], a:'B', e:'CLT is why we can apply normal distribution-based tests to many real-world scenarios.' },
    { c:"What is the difference between Type I and Type II errors?", o:['They are the same','Type I (false positive): rejecting a true null hypothesis; Type II (false negative): keeping a false null hypothesis','Type I is less serious','Type II is a false positive'], a:'B', e:'Type I = convicting an innocent person; Type II = acquitting a guilty person.' },
    { c:"What does statistical significance mean?", o:['The result is important','The observed result is unlikely to occur by random chance alone (p-value < significance level)','The effect size is large','The sample size is adequate'], a:'B', e:'Statistical significance means the evidence is strong enough to reject the null hypothesis.' },
    { c:"What is the interquartile range (IQR)?", o:['The range of all data','Q3 - Q1: the range of the middle 50% of data, used to identify outliers','The average deviation from the mean','The standard deviation squared'], a:'B', e:'IQR is resistant to outliers. Outliers are typically defined as values beyond Q1-1.5×IQR or Q3+1.5×IQR.' },
    { c:"When should you use a chi-square test?", o:['Comparing means of two groups','Testing association or independence between two categorical variables','Measuring correlation between continuous variables','Comparing variances'], a:'B', e:'Chi-square tests observed vs expected frequencies for categorical data.' },
    { c:"What is the difference between population and sample?", o:['They are the same','Population is the entire group of interest; a sample is a subset selected to represent the population','Sample is always more accurate','Population is always smaller'], a:'B', e:'We use sample statistics (x̄, s) to estimate population parameters (μ, σ).' },
    { c:"What is Bayes Theorem used for?", o:['Calculating mean','Updating probability estimates as new evidence is observed','Linear regression','Hypothesis testing'], a:'B', e:"Bayes' theorem is fundamental to Bayesian statistics, spam filters, and medical diagnostics." },
    { c:"What is multicollinearity?", o:['Having many response variables','When predictor variables are highly correlated with each other, making coefficient estimates unstable','A missing data problem','An outlier detection issue'], a:'B', e:'Multicollinearity inflates standard errors and makes it hard to determine individual variable effects.' },
    { c:"What is the difference between correlation and causation?", o:['They are the same','Correlation shows two variables move together; causation means one directly causes the other','Causation is weaker than correlation','Correlation always implies causation with large samples'], a:'B', e:'Ice cream sales and drowning rates are correlated (both increase in summer) but ice cream does not cause drowning.' },
    { c:"What does a p-value of 0.03 mean if your significance level is 0.05?", o:['Fail to reject the null hypothesis','Reject the null hypothesis — evidence is strong enough (0.03 < 0.05)','The effect size is large','Increase the sample size'], a:'B', e:'Since 0.03 < α=0.05, we reject H₀ and conclude the result is statistically significant.' },
  ],
  Docker: [
    { c:"What is the difference between a Docker image and a container?", o:['They are the same','An image is a read-only template/blueprint; a container is a running instance of that image','A container is stored; an image runs','Images are temporary; containers persist'], a:'B', e:'Image = class. Container = object/instance. You can run many containers from one image.' },
    { c:"What is the purpose of a Dockerfile COPY instruction?", o:['Copies files between containers','Copies files from the build context into the image filesystem during the build','Copies environment variables','Copies network configurations'], a:'B', e:'COPY src dest — files copied during docker build become part of the image layer.' },
    { c:"What does Docker Compose enable?", o:['Monitoring containers','Defining and running multi-container applications using a YAML file','Building Docker images faster','Managing Docker Hub repositories'], a:'B', e:'Docker Compose lets you define services (web, db, cache) with their networks and volumes in one file.' },
    { c:"What is a Docker volume used for?", o:['Increasing container CPU','Persisting data generated by containers beyond the container lifecycle','Networking between containers','Building images'], a:'B', e:'Without volumes, container data is lost when the container stops. Volumes persist independently.' },
    { c:"What is the difference between CMD and ENTRYPOINT in a Dockerfile?", o:['They are identical','ENTRYPOINT defines the fixed executable; CMD provides default arguments that can be overridden','CMD is always required','ENTRYPOINT can be easily overridden'], a:'B', e:'ENTRYPOINT is the main process; CMD is its default arguments. CMD is overridden by docker run arguments.' },
    { c:"What does the `-p 8080:80` flag do in `docker run`?", o:['Sets container memory','Maps host port 8080 to container port 80','Creates a volume','Names the container'], a:'B', e:'Port mapping: traffic to host:8080 is forwarded to container:80.' },
    { c:"What is a multi-stage Docker build?", o:['Building multiple images simultaneously','Using multiple FROM statements to separate build and runtime environments, producing smaller final images','Running multiple containers','Parallel image building'], a:'B', e:'Multi-stage builds exclude build tools from the final image, significantly reducing image size.' },
    { c:"What is the default Docker network type?", o:['Container storage configuration','Bridge network — containers on the same bridge can communicate','DNS configuration for containers','Load balancing between containers'], a:'B', e:'Bridge network: containers on the same bridge can communicate; host: shares host network.' },
    { c:"How do you pass environment variables to a Docker container?", o:['Only via Dockerfile','Using -e flag in docker run or the environment section in docker-compose.yml','By embedding in the image','Using volume mounts only'], a:'B', e:'docker run -e KEY=VALUE or env_file in docker-compose.yml are the standard approaches.' },
    { c:"What does `docker ps -a` show?", o:['Only running containers','All containers including stopped ones','All available images','Container resource usage'], a:'B', e:'docker ps shows running containers; -a flag includes stopped/exited containers.' },
  ],
  AWS: [
    { c:"What is the AWS Shared Responsibility Model?", o:['AWS handles everything','AWS manages security OF the cloud (infrastructure); customers manage security IN the cloud (data, IAM, apps)','Customers handle everything','It only applies to S3'], a:'B', e:'AWS secures the physical infrastructure; you are responsible for what you deploy on it.' },
    { c:"What is the difference between EC2 and Lambda?", o:['They are the same service','EC2 provides virtual machines you manage; Lambda is serverless (AWS manages the server, you provide the function)','Lambda is for databases only','EC2 is cheaper than Lambda always'], a:'B', e:'EC2: full control, persistent server. Lambda: event-driven, auto-scaling, pay per invocation, no server management.' },
    { c:"What is an S3 bucket policy?", o:['A pricing plan','A JSON document that grants or denies permissions to S3 resources for users, roles, or other AWS accounts','A storage optimization setting','A network security group'], a:'B', e:'Bucket policies control who can access S3 objects and what actions they can perform.' },
    { c:"What is Auto Scaling in AWS?", o:['Automatically upgrading EC2 instance types','Automatically adjusting the number of EC2 instances based on demand to maintain performance and control costs','Automatically backing up data','Automatically applying security patches'], a:'B', e:'Auto Scaling scales out (adds instances) on high load and scales in (removes) on low load.' },
    { c:"What is IAM in AWS?", o:['A database service','Identity and Access Management — controls who can do what to which AWS resources via users, roles, and policies','An analytics service','A content delivery service'], a:'B', e:'IAM is the foundation of AWS security. Principle of least privilege: grant only necessary permissions.' },
    { c:"What is the difference between RDS and DynamoDB?", o:['No difference','RDS is managed relational SQL databases (MySQL, Postgres etc.); DynamoDB is managed serverless NoSQL key-value store','DynamoDB only supports SQL','RDS is always cheaper'], a:'B', e:'RDS: structured relational data with ACID transactions. DynamoDB: massive scale, flexible schema.' },
    { c:"What is AWS VPC?", o:['A storage service','Virtual Private Cloud — a logically isolated virtual network where you launch AWS resources','A DNS service','A monitoring service'], a:'B', e:'VPC lets you define your own network topology in AWS — subnets, route tables, security groups.' },
    { c:"What is CloudFront and what problem does it solve?", o:['A database service','A CDN (Content Delivery Network) that caches content at global edge locations to reduce latency for users worldwide','A compute service','A container orchestration service'], a:'B', e:'CloudFront serves content from the nearest edge location instead of the origin server, reducing latency.' },
    { c:"What does the AWS Well-Architected Framework define?", o:['AWS pricing tiers','Best practices across 5 pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization','AWS service limits','Deployment automation tools'], a:'B', e:'The Well-Architected Framework helps evaluate and improve cloud architectures against AWS best practices.' },
    { c:"What is SQS (Simple Queue Service) used for?", o:['Storing files','Decoupling application components by enabling asynchronous message-passing between services','Sending emails','Running serverless functions'], a:'B', e:'SQS allows producers to enqueue messages and consumers to process them independently, improving resilience.' },
  ],
  Git: [
    { c:"What is the difference between `git merge` and `git rebase`?", o:['No difference','Merge creates a new merge commit preserving history; rebase replays commits for a linear history','Rebase is always safer','Merge loses commit history'], a:'B', e:'Merge: non-destructive, preserves all history. Rebase: cleaner linear history but rewrites commits.' },
    { c:"What does `git cherry-pick` do?", o:['Selects a random commit','Applies a specific commit from one branch to another without merging the entire branch','Deletes specified commits','Squashes commits together'], a:'B', e:'Cherry-pick is useful when you need just one specific commit from another branch.' },
    { c:"What is a detached HEAD state in Git?", o:['A deleted branch','When HEAD points directly to a commit instead of a branch — commits made here are not on any branch','A merge conflict state','A way to view old commits safely'], a:'B', e:'In detached HEAD, you can explore but commits are not tracked by any branch.' },
    { c:"What is a Git remote?", o:['A local copy of a repo','A version of the repository hosted on a server (like GitHub) that aliases under a name like "origin"','A deleted branch','A type of commit'], a:'B', e:'origin is the default remote name referring to the URL you cloned from.' },
    { c:"What does `git fetch` do differently from `git pull`?", o:['They are identical','fetch downloads remote changes without merging; pull fetches AND merges into current branch','pull is safer than fetch','fetch modifies your working directory'], a:'B', e:'git fetch is safe — it updates remote-tracking branches. git pull = fetch + merge (or rebase).' },
    { c:"What is a Git tag and when is it used?", o:['A branch with special permissions','A permanent named reference to a specific commit, commonly used to mark release versions (v1.0, v2.0)','A type of merge commit','A submodule reference'], a:'B', e:'Annotated tags (git tag -a v1.0) store extra metadata and are signed, ideal for releases.' },
    { c:"What problem does `.gitignore` solve?", o:['Speeds up git operations','Prevents specified files and directories from being tracked by Git (e.g., node_modules, .env, dist)','Encrypts sensitive files','Automatically commits files'], a:'B', e:'Without .gitignore, you would accidentally commit node_modules, build artifacts, and secrets.' },
    { c:"What is the Git staging area (index)?", o:['The remote repository','An intermediate area where you prepare and review changes before committing them','The HEAD commit','A conflict resolution tool'], a:'B', e:'The staging area lets you craft precise commits by choosing exactly which changes to include.' },
    { c:"What does `git stash` do and when is it useful?", o:['Permanently deletes uncommitted changes','Temporarily saves uncommitted changes so you can switch branches without committing incomplete work','Commits all changes immediately','Creates a backup branch'], a:'B', e:'Common use: need to fix urgent bug on another branch but current work is incomplete.' },
    { c:"What is a merge conflict and how is it resolved?", o:['A failed push to remote','When Git cannot automatically reconcile differences between branches — resolved manually by editing conflict markers','A corrupted commit','A network error during push'], a:'B', e:'Conflicts are marked with <<<, ===, >>> in the file. Edit to desired state, git add, then git commit.' },
  ],
  'API Development': [
    { c:"What is the difference between REST and GraphQL?", o:['They are the same','REST uses fixed endpoints returning predetermined data; GraphQL uses a single endpoint where clients specify exactly what data they need','GraphQL is always faster','REST requires less setup'], a:'B', e:"GraphQL solves REST's over-fetching and under-fetching by letting clients query exactly what they need." },
    { c:"What are the HTTP status code categories?", o:['All mean success','2xx Success, 3xx Redirection, 4xx Client Error, 5xx Server Error','4xx means server error','5xx means client error'], a:'B', e:'200 OK, 201 Created, 301 Redirect, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error.' },
    { c:"What is OAuth 2.0 used for?", o:['Password encryption','An authorization framework allowing third-party apps to access user resources without exposing credentials','Database authentication','API rate limiting'], a:'B', e:'OAuth 2.0 powers "Login with Google/GitHub" — you authorize the app without sharing your password.' },
    { c:"What is API rate limiting and why is it implemented?", o:['A way to speed up APIs','Restricting the number of requests a client can make in a time window to prevent abuse','Caching API responses','API versioning strategy'], a:'B', e:'Rate limiting protects backends from DDoS, scraping, and abuse. Common: 1000 requests/hour per API key.' },
    { c:"What is the purpose of API versioning?", o:['To add authentication','To allow multiple versions of an API to coexist so clients are not broken by changes (/api/v1, /api/v2)','To improve performance','To document the API'], a:'B', e:'Versioning prevents breaking existing clients when you update the API contract.' },
    { c:"What is CORS and why does it need to be configured in APIs?", o:['A caching mechanism','Cross-Origin Resource Sharing — a browser security policy that blocks requests from different origins; APIs must explicitly allow trusted origins','An authentication protocol','An API documentation tool'], a:'B', e:'Without CORS headers, browsers block frontend JS from fetching data from a different domain/port.' },
    { c:"What is the difference between authentication and authorization?", o:['They are the same','Authentication verifies WHO you are; Authorization determines WHAT you are allowed to do','Authorization comes before authentication','Authentication is optional'], a:'B', e:'Auth-N: "Are you really who you claim to be?" Auth-Z: "OK you are logged in, but can you access THIS resource?"' },
    { c:"What is idempotency in REST APIs?", o:['An API that never fails','Making the same request multiple times produces the same result as making it once — GET, PUT, DELETE are idempotent; POST is not','An API with no side effects','A caching strategy'], a:'B', e:'Idempotency is important for handling retries safely — retrying a PUT 3 times is safe; retrying a POST may create duplicates.' },
    { c:"What is API documentation and what tool is commonly used?", o:['Comments in code','A specification describing API endpoints, request/response formats; Swagger/OpenAPI is the standard tool','A testing framework','An authentication library'], a:'B', e:'Swagger UI generates interactive documentation from OpenAPI spec, allowing devs to test endpoints directly.' },
    { c:"What is pagination and why is it important in APIs?", o:['A documentation structure','Dividing large result sets into smaller pages using limit/offset or cursor-based techniques to improve performance','A caching mechanism','A rate limiting approach'], a:'B', e:'Returning 10,000 records in one request is slow and wastes bandwidth. Pagination returns manageable chunks.' },
  ],
};

// ─── Skills data ────────────────────────────────────────────────────────────
const SKILLS_DATA = [
  { skill_name:'Python',           category:'Programming',      description:'General-purpose programming language for data science, ML, and backend development.' },
  { skill_name:'JavaScript',       category:'Programming',      description:'Core web programming language for frontend and backend (Node.js) development.' },
  { skill_name:'SQL',              category:'Database',         description:'Standard language for managing and querying relational databases.' },
  { skill_name:'React',            category:'Web Development',  description:'JavaScript library for building user interfaces and SPAs.' },
  { skill_name:'Machine Learning', category:'Data Science',     description:'Algorithms and statistical models that enable computers to learn from data.' },
  { skill_name:'MongoDB',          category:'Database',         description:'NoSQL document database for flexible, scalable data storage.' },
  { skill_name:'Node.js',          category:'Web Development',  description:'JavaScript runtime for building fast, scalable server-side applications.' },
  { skill_name:'Data Analysis',    category:'Data Science',     description:'Inspecting, cleansing, and modeling data to discover useful information.' },
  { skill_name:'Statistics',       category:'Data Science',     description:'Mathematical discipline for data analysis and inference.' },
  { skill_name:'Docker',           category:'DevOps',           description:'Platform for developing, shipping, and running apps in containers.' },
  { skill_name:'AWS',              category:'Cloud',            description:'Amazon Web Services — leading cloud computing platform.' },
  { skill_name:'Git',              category:'DevOps',           description:'Distributed version control system for tracking changes in source code.' },
  { skill_name:'API Development',  category:'Programming',      description:'Designing and building application programming interfaces.' },
];

// ─── Careers data ───────────────────────────────────────────────────────────
const CAREERS_DATA = [
  { title:'Data Scientist',         industry:'Technology',    avg_salary:120000, growth_outlook:'High',   description:'Analyze complex data to extract insights and build predictive models.',
    required_skills:[{skill_name:'Python',importance:'critical'},{skill_name:'Machine Learning',importance:'critical'},{skill_name:'SQL',importance:'important'},{skill_name:'Statistics',importance:'critical'},{skill_name:'Data Analysis',importance:'important'}]},
  { title:'Full Stack Developer',   industry:'Technology',    avg_salary:110000, growth_outlook:'High',   description:'Build both frontend and backend components of web applications.',
    required_skills:[{skill_name:'JavaScript',importance:'critical'},{skill_name:'React',importance:'important'},{skill_name:'Node.js',importance:'important'},{skill_name:'MongoDB',importance:'helpful'},{skill_name:'SQL',importance:'helpful'}]},
  { title:'Frontend Developer',     industry:'Technology',    avg_salary:95000,  growth_outlook:'Medium', description:'Create user interfaces and experiences for web applications.',
    required_skills:[{skill_name:'JavaScript',importance:'critical'},{skill_name:'React',importance:'critical'},{skill_name:'Git',importance:'important'}]},
  { title:'Backend Developer',      industry:'Technology',    avg_salary:100000, growth_outlook:'High',   description:'Design and implement server-side logic, databases, and APIs.',
    required_skills:[{skill_name:'Python',importance:'critical'},{skill_name:'SQL',importance:'critical'},{skill_name:'API Development',importance:'important'},{skill_name:'Git',importance:'important'}]},
  { title:'Data Analyst',           industry:'Business',      avg_salary:80000,  growth_outlook:'High',   description:'Interpret data and turn it into actionable business insights.',
    required_skills:[{skill_name:'SQL',importance:'critical'},{skill_name:'Data Analysis',importance:'critical'},{skill_name:'Statistics',importance:'important'},{skill_name:'Python',importance:'helpful'}]},
  { title:'ML Engineer',            industry:'Technology',    avg_salary:130000, growth_outlook:'High',   description:'Build and deploy machine learning models and pipelines at scale.',
    required_skills:[{skill_name:'Python',importance:'critical'},{skill_name:'Machine Learning',importance:'critical'},{skill_name:'Docker',importance:'important'}]},
  { title:'DevOps Engineer',        industry:'Technology',    avg_salary:115000, growth_outlook:'High',   description:'Bridge development and operations with automation, CI/CD, and cloud infrastructure.',
    required_skills:[{skill_name:'Docker',importance:'critical'},{skill_name:'AWS',importance:'critical'},{skill_name:'Git',importance:'important'}]},
  { title:'Database Administrator', industry:'Enterprise',    avg_salary:90000,  growth_outlook:'Medium', description:'Manage database systems, optimize performance, and ensure data security.',
    required_skills:[{skill_name:'SQL',importance:'critical'},{skill_name:'MongoDB',importance:'important'}]},
];

// ─── POST /api/admin/seed?key=<SEED_SECRET> ─────────────────────────────────
router.post('/seed', async (req, res) => {
    const key = req.query.key || req.body.key;
    const secret = process.env.SEED_SECRET || 'sca_seed_2026';
    if (key !== secret) return res.status(401).json({ success:false, error:'Unauthorized: invalid seed key' });

    const results = { steps:[], errors:[], counts:{} };

    try {
        // ── 1. Clear ────────────────────────────────────────────────────────
        await Skill.deleteMany({});
        await Question.deleteMany({});
        await Assessment.deleteMany({});
        await Career.deleteMany({});
        await User.deleteMany({ email:'admin@sca.com' });
        results.steps.push('🗑️  Cleared all seed data');

        // ── 2. Admin user ────────────────────────────────────────────────────
        const adminUser = new User({ username:'admin', email:'admin@sca.com', password_hash:'Admin@1234', profile:{ full_name:'System Admin' } });
        await adminUser.save();
        results.steps.push('👤 Admin user: admin@sca.com / Admin@1234');

        // ── 3. Skills ────────────────────────────────────────────────────────
        const skills = await Skill.insertMany(SKILLS_DATA);
        const skillMap = {};
        skills.forEach(s => { skillMap[s.skill_name] = s; });
        results.counts.skills = skills.length;
        results.steps.push(`📚 ${skills.length} skills seeded`);

        // ── 4. Careers ───────────────────────────────────────────────────────
        const careerDocs = CAREERS_DATA.map(c => ({
            title: c.title, description: c.description, industry: c.industry,
            avg_salary: c.avg_salary, growth_outlook: c.growth_outlook,
            required_skills: c.required_skills.map(rs => ({
                skill_id: skillMap[rs.skill_name]?._id,
                required_level: rs.required_level || 'intermediate',
                importance: rs.importance
            })).filter(rs => rs.skill_id)
        }));
        const careers = await Career.insertMany(careerDocs);
        const careerMap = {};
        careers.forEach(c => { careerMap[c.title] = c; });
        results.counts.careers = careers.length;
        results.steps.push(`🎯 ${careers.length} careers seeded`);

        // ── 5. Assessments + Questions ───────────────────────────────────────
        let totalAssessments = 0, totalQuestions = 0;
        const diff2num = { beginner:1, intermediate:3, advanced:5 };

        for (const def of ASSESSMENTS) {
            const careerSkillNames = CAREER_SKILL_MAP[def.career_role] || [];
            const linkedSkillIds = careerSkillNames.filter(n => skillMap[n]).map(n => skillMap[n]._id);
            const career = careerMap[def.career_role];

            const assessment = await Assessment.create({
                title: def.title, description: def.description,
                skill_ids: linkedSkillIds,
                career_role: def.career_role,
                career_id: career?._id || null,
                question_count: 10, time_limit: def.time_limit,
                difficulty: def.difficulty, is_active: true,
            });
            totalAssessments++;

            // Insert 10 questions for the top 2 skills of this career
            for (const skillName of careerSkillNames.slice(0, 2)) {
                const skill = skillMap[skillName];
                if (!skill) continue;
                const pool = QUESTION_BANK[skillName];
                if (!pool) continue;
                const docs = pool.slice(0, 5).map(q => ({
                    skill_id: skill._id,
                    content: q.c, options: q.o, correct_answer: q.a,
                    difficulty: diff2num[def.difficulty] || 1,
                    explanation: q.e, question_type:'mcq', max_marks:1
                }));
                await Question.insertMany(docs);
                totalQuestions += docs.length;
            }
        }
        results.counts.assessments = totalAssessments;
        results.counts.questions = totalQuestions;
        results.steps.push(`📝 ${totalAssessments} assessments seeded (8 careers × 3 levels)`);
        results.steps.push(`❓ ${totalQuestions} questions seeded`);

        return res.json({ success:true, message:'🎉 Database seeded successfully!', results });

    } catch (err) {
        console.error('Seed error:', err);
        return res.status(500).json({ success:false, error:err.message, results });
    }
});

module.exports = router;

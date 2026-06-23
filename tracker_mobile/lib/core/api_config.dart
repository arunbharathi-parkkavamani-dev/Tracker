class ApiConfig {
  // Loaded dynamically via String.fromEnvironment.
  // Can be passed via --dart-define-from-file=.env during build/run.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000/api',
  );

  // Auth endpoints
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';

  // Populate/CRUD endpoints
  static const String readTickets = '/populate/read/tickets';
  static const String createTicket = '/populate/create/tickets';
  static const String updateTicket = '/populate/update/tickets';

  // Tasks endpoints
  static const String readTasks = '/populate/read/tasks';
  static const String createTask = '/populate/create/tasks';
  static const String updateTask = '/populate/update/tasks';

  // Daily Tracker/Activities endpoints
  static const String readDailyActivities = '/populate/read/dailyactivities';
  static const String createDailyActivity = '/populate/create/dailyactivities';
  static const String updateDailyActivity = '/populate/update/dailyactivities';

  // Client / Project types endpoints
  static const String readClients = '/populate/read/clients';
  static const String readTaskTypes = '/populate/read/tasktypes';

  // attendance 
  static const String readAttanance = '/populate/read/attendance';
  static const String checkIn = 'populate/create/attendance';
  static const String checkOut = 'populate/update/attendance';

  // Network Timeout Configurations
  static const int connectTimeoutSeconds = 15;
  static const int receiveTimeoutSeconds = 15;
}

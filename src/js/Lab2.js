import { randomUserMock, additionalUsers } from './Lab2-mock.js';

const COURSES = [
  'Mathematics', 'Physics', 'English', 'Computer Science', 'Dancing',
  'Chess', 'Biology', 'Chemistry', 'Law', 'Art', 'Medicine', 'Statistics',
];

const capitalize = (str) => {
  if (typeof str !== 'string' || str.length === 0) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getRandomCourse = () => COURSES[Math.floor(Math.random() * COURSES.length)];

const getRandomHexColor = () => {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor.padStart(6, '0')}`;
};

//Tas1: Merge
function mergeUsers(existingUser, newUser) {
  const merged = { ...existingUser };
  Object.keys(newUser).forEach((key) => {
    if (newUser[key] != null) {
      merged[key] = newUser[key];
    }
  });
  return merged;
}

function mergeAndFormatUsers(users1, users2) {
  const allRawUsers = [...users1, ...users2];
  const uniqueUsersMap = new Map();

  allRawUsers.forEach((rawUser) => {
    const isRandomUser = rawUser.name && rawUser.name.first;
    const id = rawUser.login?.uuid || rawUser.id;

    if (!id) return;

    const formattedUser = {
      id,
      gender: capitalize(rawUser.gender),
      title: isRandomUser ? rawUser.name.title : rawUser.title,
      full_name: isRandomUser
        ? `${capitalize(rawUser.name.first)} ${capitalize(rawUser.name.last)}`
        : rawUser.full_name,
      city: capitalize(isRandomUser ? rawUser.location.city : rawUser.city),
      state: capitalize(isRandomUser ? rawUser.location.state : rawUser.state),
      country: capitalize(isRandomUser ? rawUser.location.country : rawUser.country),
      postcode: isRandomUser ? rawUser.location.postcode : rawUser.postcode,
      coordinates: isRandomUser ? rawUser.location.coordinates : rawUser.coordinates,
      timezone: isRandomUser ? rawUser.location.timezone : rawUser.timezone,
      email: rawUser.email,
      b_date: isRandomUser ? rawUser.dob.date : rawUser.b_day,
      age: isRandomUser ? rawUser.dob.age : rawUser.age,
      phone: rawUser.phone,
      picture_large: isRandomUser ? rawUser.picture.large : rawUser.picture_large,
      picture_thumbnail: isRandomUser ? rawUser.picture.thumbnail : rawUser.picture_thumbnail,
      favorite: rawUser.favorite ?? Math.random() < 0.2,
      course: rawUser.course || getRandomCourse(),
      bg_color: user.bg_color || getRandomHexColor(),
      note: rawUser.note || 'Default note for user.',
    };

    if (uniqueUsersMap.has(id)) {
      const existingUser = uniqueUsersMap.get(id);
      uniqueUsersMap.set(id, mergeUsers(existingUser, formattedUser));
    } else {
      uniqueUsersMap.set(id, formattedUser);
    }
  });

  return Array.from(uniqueUsersMap.values());
}

const normalizeUser = (user) => ({
  ...user,
  phone: String(user.phone).replace(/\D/g, ''),
});

// Task 2: Validate
function validateUser(user) {
  const errors = [];
  const isCapitalizedString = (str) => typeof str === 'string' && str.length > 0 && str[0] === str[0].toUpperCase();

  ['full_name', 'gender', 'note', 'state', 'city', 'country'].forEach((field) => {
    if (user[field] && !isCapitalizedString(user[field])) {
      errors.push(`Field '${field}' must be a capitalized string.`);
    }
  });

  if (typeof user.age !== 'number') {
    errors.push('Field \'age\' must be a number.');
  }

  if (typeof user.email !== 'string' || !user.email.includes('@')) {
    errors.push('Field \'email\' has an invalid format.');
  }

  if (user.phone.length < 5) {
    errors.push('Field \'phone\' is too short.');
  }

  return { isValid: errors.length === 0, errors };
}

function filterValidUsers(users) {
  return users
    .map(normalizeUser)
    .filter((user) => {
      const { isValid, errors } = validateUser(user);
      if (!isValid) {
        console.warn(`[Validation] User "${user.full_name}" is invalid and was removed. Errors:`, errors.join('; '));
      }
      return isValid;
    });
}

function filterUsers(users, criteria) {
  return users.filter((user) => Object.keys(criteria).every((key) => {
    const condition = criteria[key];
    const userValue = user[key];

    if (userValue == null) return false;

    if (typeof condition === 'object' && !Array.isArray(condition)) {
      if (condition.min != null && userValue < condition.min) return false;
      if (condition.max != null && userValue > condition.max) return false;
      return true;
    }
    if (Array.isArray(condition)) {
      return condition.includes(userValue);
    }
    return userValue === condition;
  }));
}

function sortUsers(users, key, direction = 'asc') {
  const sorted = [...users];
  const dir = direction === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    if (a[key] == null) return 1;
    if (b[key] == null) return -1;

    if (a[key] > b[key]) return 1 * dir;
    if (a[key] < b[key]) return -1 * dir;
    return 0;
  });
  return sorted;
}

function searchUsers(users, query) {
  const lowerCaseQuery = String(query).toLowerCase();
  return users.filter((user) => Object.keys(user).some((key) => {
    const value = user[key];
    if (typeof value === 'string') {
      return value.toLowerCase().includes(lowerCaseQuery);
    }
    if (typeof value === 'number') {
      return String(value).includes(lowerCaseQuery);
    }
    return false;
  }));
}

function calculatePercentage(users, criteria) {
  if (!users || users.length === 0) return 0;
  const filteredCount = filterUsers(users, criteria).length;
  return (filteredCount / users.length) * 100;
}

console.log('--- Lab 2 Start ---');

console.group('Task 1: Merge, Format and Enrich');
const initialTeachers = mergeAndFormatUsers(randomUserMock, additionalUsers);
console.log(`Total unique users after merging: ${initialTeachers.length}`);
const olivia = initialTeachers.find(u => u.full_name.includes('Olivia'));
console.log('Sample merged user:', olivia);
console.groupEnd();

console.group('Task 2: Validate Users');
const allTeachers = filterValidUsers(initialTeachers);
console.log(`Total users after validation: ${allTeachers.length}`);
console.log('Sample valid teacher object:', allTeachers[0]);
console.groupEnd();

console.group('Task 3: Filter Users');
const filterCriteria = { country: 'Norway', gender: 'Female' };
const filteredTeachers = filterUsers(allTeachers, filterCriteria);
console.log('Filtering by:', filterCriteria);
console.log(`Found ${filteredTeachers.length} female teachers from Norway:`, filteredTeachers.map((u) => u.full_name));
console.groupEnd();

console.group('Task 4: Sort Users');
const sortedByCountry = sortUsers(allTeachers, 'country', 'asc');
console.log('Sorted by Country (ASC, first 5):', sortedByCountry.slice(0, 5).map((u) => `${u.full_name} - ${u.country}`));
const sortedByAgeDesc = sortUsers(allTeachers, 'age', 'desc');
console.log('Sorted by Age (DESC, first 5):', sortedByAgeDesc.slice(0, 5).map((u) => `${u.full_name} - ${u.age}`));
console.groupEnd();

console.group('Task 5: Search Users');
const searchQuery = 'Eugene';
const foundTeachers = searchUsers(allTeachers, searchQuery);
console.log(`Searching for teachers with query "${searchQuery}"...`);
console.log(`Found ${foundTeachers.length} teachers:`, foundTeachers.map((u) => u.full_name));
console.groupEnd();

console.group('Task 6: Calculate Percentage');
const percentageFilters = { favorite: true };
const percentage = calculatePercentage(allTeachers, percentageFilters);
console.log(`Percentage of favorite teachers: ${percentage.toFixed(2)}%`);
console.groupEnd();

console.log('--- Lab 2 End ---');

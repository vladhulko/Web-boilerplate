// eslint-disable-next-line import/extensions
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

// Task 1: Merge and Format
function formatUser(user) {
  const isRandomUser = user.name && user.name.first;

  return {
    id: user.login?.uuid || user.id,
    gender: user.gender || 'N/A',
    title: isRandomUser ? user.name.title : user.title,
    full_name: isRandomUser
      ? `${capitalize(user.name.first)} ${capitalize(user.name.last)}`
      : user.full_name,
    city: capitalize(isRandomUser ? user.location.city : user.city),
    state: capitalize(isRandomUser ? user.location.state : user.state),
    country: capitalize(isRandomUser ? user.location.country : user.country),
    postcode: isRandomUser ? user.location.postcode : user.postcode,
    coordinates: isRandomUser ? user.location.coordinates : user.coordinates,
    timezone: isRandomUser ? user.location.timezone : user.timezone,
    email: user.email,
    b_date: isRandomUser ? user.dob.date : user.b_day,
    age: isRandomUser ? user.dob.age : user.age,
    phone: user.phone,
    picture_large: isRandomUser ? user.picture.large : user.picture_large,
    picture_thumbnail: isRandomUser ? user.picture.thumbnail : user.picture_thumbnail,
    favorite: Math.random() < 0.2,
    course: getRandomCourse(),
    bg_color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    note: 'Some note about the user.',
  };
}

function mergeAndFormatUsers(users1, users2) {
  const combined = [...users1, ...users2];
  const uniqueUsers = new Map();

  combined.forEach((user) => {
    const id = user.login?.uuid || user.id;
    if (id && !uniqueUsers.has(id)) {
      uniqueUsers.set(id, user);
    }
  });

  return Array.from(uniqueUsers.values()).map(formatUser);
}

// Task 2: Validation
const normalizeUser = (user) => ({
  ...user,
  phone: String(user.phone).replace(/\D/g, ''),
});

function validateUser(user) {
  const errors = [];
  const isCapitalizedString = (str) => typeof str === 'string' && str.length > 0 && str[0] === str[0].toUpperCase();

  ['full_name', 'city', 'country', 'state'].forEach((field) => {
    if (!isCapitalizedString(user[field])) {
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

// Task 3: Filter
function filterUsers(users, criteria) {
  return users.filter((user) => Object.keys(criteria).every((key) => {
    const condition = criteria[key];
    const userValue = user[key];

    if (userValue == null) return false;

    if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
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

// Task 4: Sort
function sortUsers(users, key, direction = 'asc') {
  const sorted = [...users];
  const dir = direction === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    if (a[key] > b[key]) return 1 * dir;
    if (a[key] < b[key]) return -1 * dir;
    return 0;
  });
  return sorted;
}

// Task 5: Search
function searchUsers(users, query) {
  const lowerCaseQuery = String(query).toLowerCase();
  return users.filter((user) => (
    user.full_name.toLowerCase().includes(lowerCaseQuery)
    || user.note.toLowerCase().includes(lowerCaseQuery)
    || String(user.age).includes(lowerCaseQuery)
  ));
}

// Task 6: Calculate Percentage
function calculatePercentage(users, criteria) {
  if (!users || users.length === 0) return 0;
  const filteredCount = filterUsers(users, criteria).length;
  return (filteredCount / users.length) * 100;
}

console.log('--- Lab 2 Start ---');

console.group('Task 1: Merge and Format');
const initialTeachers = mergeAndFormatUsers(randomUserMock, additionalUsers);
console.log(`Total users after merging: ${initialTeachers.length}`);
console.log('Sample processed teacher object (before validation):', initialTeachers[0]);
console.groupEnd();

console.group('Task 2: Validate Users');
const allTeachers = filterValidUsers(initialTeachers);
console.log(`Total users after validation: ${allTeachers.length}`);
console.log('Sample valid teacher object:', allTeachers[0]);
console.groupEnd();

console.group('Task 3: Filter Users');
const filterCriteria = { country: 'Germany', age: { min: 60 } };
const filteredTeachers = filterUsers(allTeachers, filterCriteria);
console.log('Filtering by:', filterCriteria);
console.log(`Found ${filteredTeachers.length} teachers:`, filteredTeachers.map((u) => u.full_name));
console.groupEnd();

console.group('Task 4: Sort Users');
const sortedByName = sortUsers(allTeachers, 'full_name', 'asc');
console.log('Sorted by Full Name (ASC, first 5):', sortedByName.slice(0, 5).map((u) => u.full_name));
const sortedByAge = sortUsers(allTeachers, 'age', 'desc');
console.log('Sorted by Age (DESC, first 5):', sortedByAge.slice(0, 5).map((u) => `${u.full_name} - ${u.age}`));
console.groupEnd();

console.group('Task 5: Search Users');
const searchQuery = 'Norbert';
const foundTeachers = searchUsers(allTeachers, searchQuery);
console.log(`Searching for teachers with query "${searchQuery}"...`);
console.log(`Found ${foundTeachers.length} teachers:`, foundTeachers.map((u) => u.full_name));
console.groupEnd();

console.group('Task 6: Calculate Percentage');
const percentageFilters = { age: { min: 40 } };
const percentage = calculatePercentage(allTeachers, percentageFilters);
console.log(`Percentage of teachers with age >= ${percentageFilters.age.min}: ${percentage.toFixed(2)}%`);
console.groupEnd();

console.log('--- Lab 2 End ---');

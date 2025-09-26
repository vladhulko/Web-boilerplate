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

const getRandomHexColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

const getTeachers = () => {
  const allRawUsers = [...randomUserMock, ...additionalUsers];
  const uniqueUsersMap = new Map();

  allRawUsers.forEach((rawUser) => {
    const isRandomUser = !!(rawUser.name && rawUser.name.first);
    const id = rawUser.login?.uuid || rawUser.id;
    if (!id) return;

    let existingUser = uniqueUsersMap.get(id) || {};
    const formattedUser = {
      id,
      gender: rawUser.gender ? capitalize(rawUser.gender) : existingUser.gender,
      title: isRandomUser ? rawUser.name.title : (rawUser.title || existingUser.title),
      full_name: isRandomUser
          ? `${capitalize(rawUser.name.first)} ${capitalize(rawUser.name.last)}`
          : (rawUser.full_name || existingUser.full_name),
      city: rawUser.location?.city ? capitalize(rawUser.location.city) : (rawUser.city ? capitalize(rawUser.city) : existingUser.city),
      state: rawUser.location?.state ? capitalize(rawUser.location.state) : (rawUser.state ? capitalize(rawUser.state) : existingUser.state),
      country: rawUser.location?.country ? capitalize(rawUser.location.country) : (rawUser.country ? capitalize(rawUser.country) : existingUser.country),
      postcode: isRandomUser ? rawUser.location.postcode : rawUser.postcode,
      coordinates: isRandomUser ? rawUser.location.coordinates : rawUser.coordinates,
      timezone: isRandomUser ? rawUser.location.timezone : rawUser.timezone,
      email: rawUser.email,
      b_date: isRandomUser ? rawUser.dob.date : (rawUser.b_day || rawUser.b_date),
      age: isRandomUser ? rawUser.dob.age : rawUser.age,
      phone: rawUser.phone,
      picture_large: isRandomUser ? rawUser.picture.large : rawUser.picture_large,
      picture_thumbnail: isRandomUser ? rawUser.picture.thumbnail : rawUser.picture_thumbnail,
      favorite: rawUser.favorite ?? existingUser.favorite ?? (Math.random() < 0.2),
      course: rawUser.course ?? existingUser.course ?? getRandomCourse(),
      bg_color: rawUser.bg_color ?? existingUser.bg_color ?? getRandomHexColor(),
      note: rawUser.note ?? existingUser.note ?? 'Default note for user.',
    };
    uniqueUsersMap.set(id, { ...existingUser, ...formattedUser });
  });

  const initialTeachers = Array.from(uniqueUsersMap.values());

  const normalizeUser = (user) => ({
    ...user,
    phone: user.phone ? String(user.phone).replace(/\D/g, '') : '',
  });

  const validateUser = (user) => {
    if (!user.full_name || typeof user.full_name !== 'string' || user.full_name.trim() === '') return false;
    // FIX: Stricter validation for age to ensure it's a number and not undefined/null.
    if (typeof user.age !== 'number' || !Number.isInteger(user.age)) return false;
    if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) return false;
    return true;
  };

  return initialTeachers.map(normalizeUser).filter(validateUser);
};

export { getTeachers, capitalize, getRandomCourse, getRandomHexColor };

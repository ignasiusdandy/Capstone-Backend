const { createArticle, getAllArticles } = require('./handler/articleHandler');
const { registerHandler, loginHandler, logoutHandler } = require('./handler/authHandler');
const { createEmergency, getEmergenciesWithinRadius, updateEmergencyUser, acceptEmergency, completeEmergency, acceptEmergencyList, completeEmergencyList, dataUserEmergency, reportList } = require('./handler/emergencyHandler');
const verifyTokenMiddleware = require('./middleware/verifyTokenMiddleware');

const routes = [
  {
    method: 'POST',
    path: '/register',
    handler: registerHandler,
  },
  {
    method: 'POST',
    path: '/login',
    handler: loginHandler,
  },
  {
    method: 'POST',
    path: '/logout',
    handler: logoutHandler,
  },
  {
    method: 'POST',
    path: '/emergency/create',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        allow: ['multipart/form-data'], 
        maxBytes: 1024 * 1024 * 10, 
        multipart: true,
      },
      handler: createEmergency,
      pre: [{ method: verifyTokenMiddleware }], 
    },
  },
  {
    method: 'PUT',
    path: '/emergency/update/{em_id}',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        allow: ['multipart/form-data'], 
        maxBytes: 1024 * 1024 * 10, 
        multipart: true,
      },
      handler: updateEmergencyUser,
      pre: [{ method: verifyTokenMiddleware }], 
    },
  },
  {
    method: 'GET',
    path: '/emergency/userEmergency',
    handler: dataUserEmergency,
    options: {
      pre: [verifyTokenMiddleware],
    },
  },
  {
    method: 'GET',
    path: '/emergency/reportList/{emergencyId}',
    handler: reportList,
    options: {
      pre: [verifyTokenMiddleware],
    },
  },
  {
    method: 'GET',
    path: '/community/emergency/dataList',
    handler: getEmergenciesWithinRadius,
    options: {
      pre: [verifyTokenMiddleware],
    },
  },
  {
    method: 'PUT',
    path: '/emergency/acceptEmergency/{em_id}',
    handler: acceptEmergency,
    options: {
      pre: [verifyTokenMiddleware],
    },
  },
  {
    method: 'GET',
    path: '/emergency/acceptList',
    handler: acceptEmergencyList,
    options: {
      pre: [verifyTokenMiddleware],
    },
  },
  {
    method: 'PUT',
    path: '/emergency/completeEmergency/{em_id}',
    handler: completeEmergency,
    options: {
      pre: [verifyTokenMiddleware],
    },
  },
  {
    method: 'GET',
    path: '/emergency/completeList',
    handler: completeEmergencyList,
    options: {
      pre: [verifyTokenMiddleware],
    },
  },
  {
    method: 'POST',
    path: '/article/create',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        allow: ['multipart/form-data'], 
        maxBytes: 1024 * 1024 * 10, 
        multipart: true,
      },
      handler: createArticle,
      pre: [{ method: verifyTokenMiddleware }], 
    },
  },
  {
    method: 'GET',
    path: '/article/allArticle',
    handler: getAllArticles,
    options: {
      pre: [verifyTokenMiddleware],
    },
  },
];

module.exports = routes;

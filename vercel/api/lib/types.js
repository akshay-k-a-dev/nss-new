/**
 * @typedef {Object} Program
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} date
 * @property {string} time
 * @property {string} venue
 * @property {string} coordinator
 * @property {string[]} coordinatorIds
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string[]} [participantIds]
 */

/**
 * @typedef {Object} RegisteredStudent
 * @property {string} id
 * @property {string} name
 * @property {string} department
 * @property {string} password
 * @property {string} createdAt
 * @property {string} [profileImageUrl]
 */

/**
 * @typedef {Object} Coordinator
 * @property {string} id
 * @property {string} name
 * @property {string} department
 * @property {string} password
 * @property {boolean} isActive
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Department
 * @property {string} id
 * @property {string} name
 * @property {boolean} isActive
 * @property {string} createdAt
 */

/**
 * @typedef {Object} StudentExtraActivity
 * @property {string} id
 * @property {'green' | 'yellow'} badge
 * @property {string} title
 * @property {string} content
 * @property {string} createdAt
 */

/**
 * @typedef {Object} CoordinatedProgram
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} date
 * @property {string} time
 * @property {string} venue
 * @property {string} createdAt
 */

/**
 * @typedef {Object} StudentReport
 * @property {string} studentId
 * @property {StudentExtraActivity[]} activities
 * @property {CoordinatedProgram[]} coordinatedPrograms
 */

/**
 * @typedef {Object} HomepageImage
 * @property {string} id
 * @property {string} url
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} Officer
 * @property {string} id
 * @property {string} name
 * @property {string} password
 */

export {};

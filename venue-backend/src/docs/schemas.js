/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [USER, ORGANIZER, ADMIN]
 *         profilePicture:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     UserProfileInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         profilePicture:
 *           type: string
 *           format: uri
 *           description: URL of the uploaded image
 *
 *     PasswordChangeInput:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 6
 *
 *     Event:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *         price:
 *           type: number
 *         category:
 *           type: string
 *         image:
 *           type: string
 *         organizerId:
 *           type: string
 *         isPublished:
 *           type: boolean
 *
 *     Movie:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         releaseDate:
 *           type: string
 *           format: date-time
 *         runtime:
 *           type: string
 *         genre:
 *           type: string
 *         poster:
 *           type: string
 *         organizer:
 *           type: string
 *         isPublished:
 *           type: boolean
 *
 *     Slot:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         parentId:
 *           type: string
 *         parentType:
 *           type: string
 *           enum: [Event, Movie]
 *         date:
 *           type: string
 *           format: date-time
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         capacity:
 *           type: integer
 *         availableSeats:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [AVAILABLE, FULL]
 *
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         slotId:
 *           type: string
 *         quantity:
 *           type: integer
 *         seats:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [CONFIRMED, CANCELLED]
 *         paymentId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         message:
 *           type: string
 *           example: Something went wrong
 *
 *     # -----------------------------------------------------
 *     # GENERIC API RESPONSE WRAPPERS
 *     # -----------------------------------------------------
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         statusCode:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: Operation successful
 *         data:
 *           type: object
 *           nullable: true
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         statusCode:
 *           type: integer
 *           example: 400
 *         message:
 *           type: string
 *           example: Error description
 *
 *     # -----------------------------------------------------
 *     # TYPED WRAPPERS (Uses allOf to inherit generic structure)
 *     # -----------------------------------------------------
 *
 *     ApiResponse_User:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/User'
 *
 *     ApiResponse_Event:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/Event'
 *
 *     ApiResponse_Movie:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/Movie'
 *
 *     ApiResponse_Slot:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/Slot'
 *
 *     ApiResponse_Booking:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/Booking'
 *
 *     # -----------------------------------------------------
 *     # ARRAY WRAPPERS
 *     # -----------------------------------------------------
 *
 *     ApiResponse_Array_Event:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *
 *     ApiResponse_Array_Movie:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Movie'
 *
 *     ApiResponse_Array_Slot:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Slot'
 *
 *     ApiResponse_Array_Booking:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */

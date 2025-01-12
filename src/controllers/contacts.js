import {
  createContact,
  deleteContact,
  getAllContacts,
  getContactById,
  updateContact,
} from '../services/contacts.js';

import createHttpError from 'http-errors';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';
import { saveFileToUploadDir } from '../utils/saveFileToUploadDir.js';
import { getEnvVar } from '../utils/getEnvVar.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getContactsController = async (req, res) => {
  const userId = req.user._id;

  const { page, perPage } = parsePaginationParams(req.query);
  const { sortOrder, sortBy } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);
  const contacts = await getAllContacts({
    userId,
    page,
    perPage,
    sortOrder,
    sortBy,
    filter,
  });

  res.json({
    status: 200,
    message: 'Successfully found contacts!',
    data: contacts,
  });
};

export const getContactByIdController = async (req, res, next) => {
  const userId = req.user._id;

  const { contactId } = req.params;
  const contact = await getContactById(contactId, userId);

  if (!contact) {
    throw createHttpError(404, `Contact with id ${contactId} not found`);
  }
  res.json({
    status: 200,
    message: `Successfully found contact with id ${contactId}!`,
    data: contact,
  });
};

export const createContactController = async (req, res) => {
  // console.log(req.body);
  // console.log(req.file);
  let photoUrl;
  if (req.file) {
    if (getEnvVar('ENABLE_CLOUDINARY') === 'true') {
      photoUrl = await saveFileToCloudinary(req.file);
    } else {
      photoUrl = await saveFileToUploadDir(req.file);
    }
  }
  const userId = req.user._id;
  const contact = await createContact(req.body, userId, { photo: photoUrl });
  res.status(201).json({
    status: 201,
    message: `Successfully created a contact!`,
    data: contact,
  });
};

export const deleteContactController = async (req, res, next) => {
  const userId = req.user._id;

  const { contactId } = req.params;
  const contact = await deleteContact(contactId, userId);

  if (!contact) {
    next(createHttpError(404, 'Student not found'));
    return;
  }

  res.status(204).send();
};

export const upsertContactController = async (req, res, next) => {
  const userId = req.user._id;
  const { contactId } = req.params;
  const result = await updateContact(contactId, userId, req.body, {
    upsert: true,
  });

  if (!result) {
    next(createHttpError(404, 'Contact not found'));
    return;
  }

  const status = result.isNew ? 201 : 200;

  res.status(status).json({
    status,
    message: `Successfully upserted a contact!`,
    data: result.contact,
  });
};

export const patchContactController = async (req, res, next) => {
  const userId = req.user._id;
  const { contactId } = req.params;

  let photoUrl;
  if (req.file)
    if (getEnvVar('ENABLE_CLOUDINARY') === 'true') {
      photoUrl = await saveFileToCloudinary(req.file);
    } else {
      photoUrl = await saveFileToUploadDir(req.file);
    }

  const updatedData = {
    ...req.body,
    photo: photoUrl,
  };

  const result = await updateContact(contactId, userId, updatedData);

  if (!result) {
    next(createHttpError(404, 'Contact not found'));
    return;
  }

  res.json({
    status: 200,
    message: `Successfully patched a contact!`,
    data: result.contact,
  });
};

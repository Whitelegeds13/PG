const Category = require('../models/Category');
const Product = require('../models/Product');

async function listCategories(req, res) {
  const filter = req.user?.role === 'administrador' ? {} : { active: true };
  const categories = await Category.find(filter).sort({ name: 1 });

  return res.json({ categories });
}

async function createCategory(req, res) {
  const category = await Category.create({
    name: req.body.name,
    description: req.body.description,
  });

  return res.status(201).json({ category });
}

async function updateCategory(req, res) {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ message: 'Categoria no encontrada' });
  }

  const allowedFields = ['name', 'description', 'active'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      category[field] = req.body[field];
    }
  });

  await category.save();
  return res.json({ category });
}

async function deleteCategory(req, res) {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ message: 'Categoria no encontrada' });
  }

  const hasProducts = await Product.exists({ category: category._id });

  if (hasProducts) {
    return res.status(409).json({
      message: 'No se puede eliminar una categoria asociada a productos',
    });
  }

  await category.deleteOne();
  return res.status(204).send();
}

module.exports = {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
};

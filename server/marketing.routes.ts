import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// Mock data for marketing categories and items
let marketingCategories = [
  {
    id: 'postcards',
    name: 'Postcards',
    itemCount: 2,
    description: 'Professional postcards for marketing campaigns and client outreach',
    organizationId: 'org-1'
  },
  {
    id: 'business-cards',
    name: 'Business Cards',
    itemCount: 2,
    description: 'Professional business card templates and designs',
    organizationId: 'org-1'
  },
  {
    id: 'flyers',
    name: 'Flyers',
    itemCount: 2,
    description: 'Marketing flyers and promotional materials',
    organizationId: 'org-1'
  }
];

let marketingItems = [
  // Postcards
  {
    id: '1',
    categoryId: 'postcards',
    name: 'Post card 1',
    description: 'Professional postcard design template',
    fileType: 'pdf',
    fileSize: 2048576, // 2MB
    downloadCount: 15,
    createdDate: '2024-07-15T00:00:00Z',
    updatedDate: '2024-07-15T00:00:00Z',
    organizationId: 'org-1'
  },
  {
    id: '2',
    categoryId: 'postcards',
    name: 'Post card 2',
    description: 'Alternative postcard design template',
    fileType: 'pdf',
    fileSize: 1843200, // 1.8MB
    downloadCount: 8,
    createdDate: '2024-07-16T00:00:00Z',
    updatedDate: '2024-07-16T00:00:00Z',
    organizationId: 'org-1'
  },
  // Business Cards
  {
    id: '3',
    categoryId: 'business-cards',
    name: 'Business Card 1',
    description: 'Professional business card template',
    fileType: 'pdf',
    fileSize: 1024000, // 1MB
    downloadCount: 25,
    createdDate: '2024-07-10T00:00:00Z',
    updatedDate: '2024-07-10T00:00:00Z',
    organizationId: 'org-1'
  },
  {
    id: '4',
    categoryId: 'business-cards',
    name: 'Business Card 2',
    description: 'Alternative business card design',
    fileType: 'pdf',
    fileSize: 950000, // 950KB
    downloadCount: 12,
    createdDate: '2024-07-12T00:00:00Z',
    updatedDate: '2024-07-12T00:00:00Z',
    isComingSoon: true,
    organizationId: 'org-1'
  },
  // Flyers
  {
    id: '5',
    categoryId: 'flyers',
    name: 'Flyers 1',
    description: 'Marketing flyer template',
    fileType: 'pdf',
    fileSize: 3072000, // 3MB
    downloadCount: 7,
    createdDate: '2024-07-05T00:00:00Z',
    updatedDate: '2024-07-05T00:00:00Z',
    organizationId: 'org-1'
  },
  {
    id: '6',
    categoryId: 'flyers',
    name: 'Flyers 2',
    description: 'Promotional flyer template',
    fileType: 'pdf',
    fileSize: 2560000, // 2.5MB
    downloadCount: 3,
    createdDate: '2024-07-08T00:00:00Z',
    updatedDate: '2024-07-08T00:00:00Z',
    organizationId: 'org-1'
  }
];

// GET /api/marketing/categories - Get all categories for organization
router.get('/categories', (req: Request, res: Response) => {
  try {
    const organizationId = req.query.organizationId || 'org-1';
    const filtered = marketingCategories.filter(cat => cat.organizationId === organizationId);
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching marketing categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/marketing/categories/:id - Get specific category
router.get('/categories/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = marketingCategories.find(cat => cat.id === id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/marketing/categories - Create new category
router.post('/categories', (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      organizationId = 'org-1'
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category already exists
    const existingCategory = marketingCategories.find(
      cat => cat.name.toLowerCase() === name.toLowerCase() && cat.organizationId === organizationId
    );
    
    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    const newCategory = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description || `Marketing materials for ${name}`,
      itemCount: 0,
      organizationId
    };

    marketingCategories.push(newCategory);
    
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/marketing/categories/:id - Update category
router.put('/categories/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const categoryIndex = marketingCategories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    marketingCategories[categoryIndex] = {
      ...marketingCategories[categoryIndex],
      ...(name && { name: name.trim() }),
      ...(description && { description })
    };
    
    res.json(marketingCategories[categoryIndex]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/marketing/categories/:id - Delete category
router.delete('/categories/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categoryIndex = marketingCategories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Delete all items in this category first
    marketingItems = marketingItems.filter(item => item.categoryId !== id);
    
    // Delete the category
    marketingCategories.splice(categoryIndex, 1);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/marketing/items - Get all items for category
router.get('/items', (req: Request, res: Response) => {
  try {
    const { categoryId, organizationId = 'org-1' } = req.query;
    
    let filtered = marketingItems.filter(item => item.organizationId === organizationId);
    
    if (categoryId) {
      filtered = filtered.filter(item => item.categoryId === categoryId);
    }
    
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching marketing items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/marketing/items/:id - Get specific item
router.get('/items/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = marketingItems.find(item => item.id === id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/marketing/items - Create new item
router.post('/items', (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      name,
      description,
      fileType = 'pdf',
      fileSize = 0,
      organizationId = 'org-1'
    } = req.body;

    // Validate required fields
    if (!categoryId || !name) {
      return res.status(400).json({ error: 'Category ID and name are required' });
    }

    // Verify category exists
    const category = marketingCategories.find(cat => cat.id === categoryId);
    if (!category) {
      return res.status(400).json({ error: 'Category does not exist' });
    }

    const newItem = {
      id: Date.now().toString(),
      categoryId,
      name: name.trim(),
      description: description || '',
      fileType,
      fileSize,
      downloadCount: 0,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      organizationId
    };

    marketingItems.push(newItem);
    
    // Update category item count
    const categoryIndex = marketingCategories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex !== -1) {
      marketingCategories[categoryIndex].itemCount++;
    }
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/marketing/items/:id/download - Track item download
router.put('/items/:id/download', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const itemIndex = marketingItems.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Increment download count
    marketingItems[itemIndex] = {
      ...marketingItems[itemIndex],
      downloadCount: marketingItems[itemIndex].downloadCount + 1
    };
    
    res.json(marketingItems[itemIndex]);
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/marketing/items/:id - Update item
router.put('/items/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isComingSoon } = req.body;
    
    const itemIndex = marketingItems.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    marketingItems[itemIndex] = {
      ...marketingItems[itemIndex],
      ...(name && { name: name.trim() }),
      ...(description && { description }),
      ...(isComingSoon !== undefined && { isComingSoon }),
      updatedDate: new Date().toISOString()
    };
    
    res.json(marketingItems[itemIndex]);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/marketing/items/:id - Delete item
router.delete('/items/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const itemIndex = marketingItems.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = marketingItems[itemIndex];
    
    // Update category item count
    const categoryIndex = marketingCategories.findIndex(cat => cat.id === item.categoryId);
    if (categoryIndex !== -1) {
      marketingCategories[categoryIndex].itemCount = Math.max(0, marketingCategories[categoryIndex].itemCount - 1);
    }
    
    // Delete the item
    marketingItems.splice(itemIndex, 1);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
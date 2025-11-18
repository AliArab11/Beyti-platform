# API Development Guide for Beyti Platform

## Overview
This guide shows you how to create your own module following the Membership module pattern.

## The Pattern (3 Steps)
1. Backend: Create API Controller
2. Frontend: Add functions to api.js
3. Frontend: Create React page

---

## Step 1: Create Your API Controller

### Location
Place your controller in: `Beyti-MVC/Controllers/Api/YourModuleController.cs`

### Template Structure
```csharp
[ApiController]
[Route("api/[controller]")]
public class YourModuleController : ControllerBase
{
    private readonly BeytiContext _context;

    public YourModuleController(BeytiContext context)
    {
        _context = context;
    }

    // GET all
    [HttpGet]
    public async Task<ActionResult<IEnumerable<YourEntity>>> GetAll() { }

    // GET by id
    [HttpGet("{id}")]
    public async Task<ActionResult<YourEntity>> GetById(int id) { }

    // POST create
    [HttpPost("add")]
    public async Task<ActionResult<YourEntity>> Add([FromBody] YourEntity entity) { }

    // PUT update
    [HttpPut("update/{id}")]
    public async Task<ActionResult<YourEntity>> Update(int id, [FromBody] YourEntity entity) { }

    // DELETE
    [HttpDelete("delete/{id}")]
    public async Task<ActionResult> Delete(int id) { }
}
```

### Important: Check Your Entity in BeytiContext.cs
Before writing your controller, look at your entity class to see:
- Which fields are auto-generated (Id, CreatedAt, IsActive, etc.)
- Which fields are required vs optional
- Default values that need to be set

Example from MembershipPlan:
```csharp
membershipPlan.CreatedAt = DateTime.Now;
membershipPlan.IsActive = true;
```

### Reference Example
See: [MembershipPlansController.cs](Beyti-MVC/Controllers/Api/MembershipPlansController.cs) for complete implementation

---

## Step 2: Add Functions to api.js

### Location
[beyti-frontend/src/services/api.js](beyti-frontend/src/services/api.js)

### Pattern
```javascript
// GET all
export async function getYourEntities() {
  return fetchAPI('/YourModule');
}

// GET by id
export async function getYourEntity(id) {
  return fetchAPI(`/YourModule/${id}`);
}

// POST create
export async function createYourEntity(data) {
  return fetchAPI('/YourModule/add', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// PUT update
export async function updateYourEntity(id, data) {
  return fetchAPI(`/YourModule/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// DELETE
export async function deleteYourEntity(id) {
  return fetchAPI(`/YourModule/delete/${id}`, {
    method: 'DELETE'
  });
}
```

---

## Step 3: Create React Page

### Location
`beyti-frontend/src/pages/YourModule/index.jsx`

### Pattern
```javascript
import { useState, useEffect } from 'react';
import { getYourEntities } from '../../services/api';

export default function YourModulePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getYourEntities();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Your Module</h1>
      <table className="w-full">
        {/* Add your table columns here */}
      </table>
    </div>
  );
}
```

### Reference Example
See: [AddPlan.jsx](beyti-frontend/src/Pages/Membership/AddPlan.jsx) for complete implementation with styling

---

## Module Assignments

**Hussain:**
- Seller module → Entity: Seller
- Customer module → Entity: Customer
- Driver module → Entity: Driver

**Mohammed:**
- Admin module → Entity: AdminProfile
- ServiceProvider module → Entity: ServiceProvider

---

## Testing Your Work

1. **Backend**: Run `dotnet run` in Beyti-MVC folder
2. **Test API**: Open `https://localhost:5023/api/YourModule` in browser
3. **Frontend**: Run `npm run dev` in beyti-frontend folder
4. **View**: Navigate to your page and verify data loads

---

## Common Issues

### Issue: API returns 404
- Check controller name matches route
- Verify controller is in Api folder
- Restart dotnet run

### Issue: CORS error
- Already configured, should work
- If not, check Program.cs has UseCors("FrontendPolicy")

### Issue: Empty array []
- Database has no data yet
- Add test data or create POST functionality first

### Issue: Properties don't match
- Frontend uses PascalCase (Name, Price)
- Check your entity class for exact property names
- Example: MonthlyPrice not monthlyPrice

---

## Need Help?
Ask Ali or check the Membership module as reference!

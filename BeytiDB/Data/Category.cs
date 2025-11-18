using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("Category")]
public partial class Category
{
    [Key]
    public int Id { get; set; }

    [StringLength(60)]
    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [InverseProperty("Category")]
    public virtual ICollection<SubCategory> SubCategories { get; set; } = new List<SubCategory>();
}

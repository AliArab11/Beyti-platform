using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti_MVC.Data;

[Table("SubCategory")]
[Index("CategoryId", Name = "IX_SubCategory_Category")]
public partial class SubCategory
{
    [Key]
    public int Id { get; set; }

    public int CategoryId { get; set; }

    [StringLength(80)]
    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("CategoryId")]
    [InverseProperty("SubCategories")]
    public virtual Category Category { get; set; } = null!;

    [InverseProperty("SubCategory")]
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    [InverseProperty("SubCategory")]
    public virtual ICollection<ServiceCatalog> ServiceCatalogs { get; set; } = new List<ServiceCatalog>();
}

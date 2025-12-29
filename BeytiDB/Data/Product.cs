using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("Product")]
[Index("SellerId", Name = "IX_Product_Seller")]
[Index("SubCategoryId", Name = "IX_Product_SubCat")]
[Index("SubCategoryId", "GenderId", Name = "IX_Product_SubCat_Gender")]
public partial class Product
{
    [Key]
    public int Id { get; set; }

    public int SellerId { get; set; }

    public int? SubCategoryId { get; set; }

    public byte? GenderId { get; set; }

    [StringLength(150)]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal BasePrice { get; set; }

    [NotMapped]
    public decimal? AverageRating { get; set; }

    [Column(TypeName = "decimal(5, 2)")]
    public decimal? DiscountPercentage { get; set; }

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    public int? StoreSectionId { get; set; }

    [ForeignKey(nameof(StoreSectionId))]
    [InverseProperty("Products")]
    public virtual StoreSection? StoreSection { get; set; }

    [ForeignKey("GenderId")]
    [InverseProperty("Products")]
    public virtual Gender? Gender { get; set; }

    [InverseProperty("Product")]
    public virtual ICollection<ProductVariant> ProductVariants { get; set; } = new List<ProductVariant>();

    [InverseProperty("Product")]
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    [ForeignKey("SellerId")]
    [InverseProperty("Products")]
    public virtual Seller Seller { get; set; } = null!;

    [ForeignKey("SubCategoryId")]
    [InverseProperty("Products")]
    public virtual SubCategory SubCategory { get; set; } = null!;
}

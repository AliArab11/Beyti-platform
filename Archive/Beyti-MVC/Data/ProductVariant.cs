using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti.Data;

[Table("ProductVariant")]
[Index("ColorValueId", Name = "IX_ProductVariant_Color")]
[Index("ProductId", Name = "IX_ProductVariant_Product")]
[Index("SizeValueId", Name = "IX_ProductVariant_Size")]
public partial class ProductVariant
{
    [Key]
    public int Id { get; set; }

    public int ProductId { get; set; }

    public int? ColorValueId { get; set; }

    public int? SizeValueId { get; set; }

    [StringLength(60)]
    public string? SKU { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? Price { get; set; }

    public int StockQty { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    [ForeignKey("ColorValueId")]
    [InverseProperty("ProductVariantColorValues")]
    public virtual VariantValue? ColorValue { get; set; }

    [InverseProperty("ProductVariant")]
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    [ForeignKey("ProductId")]
    [InverseProperty("ProductVariants")]
    public virtual Product Product { get; set; } = null!;

    [ForeignKey("SizeValueId")]
    [InverseProperty("ProductVariantSizeValues")]
    public virtual VariantValue? SizeValue { get; set; }
}
